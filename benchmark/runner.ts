/**
 * Benchmark Runner — Agent Execution with Git Isolation
 *
 * Manages git worktree lifecycle, spawns the Claude CLI, captures output,
 * and collects diff artifacts for scoring.
 */

import { spawn, execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

import { getTaskById } from "./tasks";
import type { BenchmarkTask } from "./tasks";
import { scoreTask, type ScoringContext } from "./scorer";
import { CLAUDE_MD_CONTENT } from "./claude-md";
import type { BenchmarkConfig, RunOptions, TaskRunResult } from "./types";

// ---------------------------------------------------------------------------
// Preflight Checks
// ---------------------------------------------------------------------------

/**
 * Verify `claude` CLI is available on PATH.
 * Required for both Config A and Config B.
 */
export function checkClaudeCli(): void {
  try {
    execSync("which claude", { encoding: "utf-8", stdio: "pipe" });
  } catch {
    console.error(
      "ERROR: `claude` CLI not found on PATH.\n" +
        "Install Claude Code: https://docs.anthropic.com/en/docs/claude-code\n" +
        "Then ensure `claude` is available in your shell.",
    );
    process.exit(1);
  }
}

/**
 * Verify `brief` CLI is available on PATH.
 * Required only for Config B — the coding agent needs it to query decisions.
 */
export function checkBriefCli(): void {
  try {
    execSync("which brief", { encoding: "utf-8", stdio: "pipe" });
  } catch {
    console.error(
      "ERROR: `brief` CLI not found on PATH.\n" +
        "Config B requires Brief CLI for the coding agent to query decisions.\n" +
        "Install: npm install -g @briefhq/cli\n" +
        "Then authenticate: brief auth login",
    );
    process.exit(1);
  }
}

/**
 * Verify the Brief workspace is seeded with benchmark data.
 * Runs `npx tsx benchmark/seed.ts --verify` and fails fast if seed data is missing.
 */
export function checkSeedData(repoPath: string): void {
  const snapshotPath = path.join(repoPath, "benchmark", "seed-snapshot.json");
  if (!fs.existsSync(snapshotPath)) {
    console.error(
      "ERROR: Brief workspace not seeded — no seed-snapshot.json found.\n" +
        "Run: npx tsx benchmark/seed.ts --api-url=<url> --api-key=<key>\n" +
        "Then re-run the benchmark.",
    );
    process.exit(1);
  }
  console.log("Seed snapshot found — Brief workspace previously seeded.");
}

// ---------------------------------------------------------------------------
// Git Worktree Management
// ---------------------------------------------------------------------------

export function createWorktree(repoPath: string): string {
  const worktreeName = `benchmark-run-${Date.now()}`;
  const worktreePath = path.resolve(repoPath, "..", worktreeName);

  execSync(`git -C "${repoPath}" worktree add "${worktreePath}" HEAD --detach`, {
    encoding: "utf-8",
    stdio: "pipe",
  });

  console.log(`Created worktree at ${worktreePath}`);
  return worktreePath;
}

export function destroyWorktree(worktreePath: string, repoPath: string): void {
  try {
    execSync(`git -C "${repoPath}" worktree remove "${worktreePath}" --force`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    console.log("Worktree cleaned up.");
  } catch (e) {
    console.warn(
      `Warning: failed to remove worktree at ${worktreePath}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

function resetWorktree(worktreePath: string): void {
  execSync(`git -C "${worktreePath}" checkout .`, {
    encoding: "utf-8",
    stdio: "pipe",
  });
  execSync(`git -C "${worktreePath}" clean -fd`, {
    encoding: "utf-8",
    stdio: "pipe",
  });

  // Verify clean state
  const status = execSync(`git -C "${worktreePath}" status --porcelain`, {
    encoding: "utf-8",
    stdio: "pipe",
  }).trim();

  if (status) {
    throw new Error(`Worktree not clean after reset:\n${status}`);
  }
}

// ---------------------------------------------------------------------------
// Agent Spawning
// ---------------------------------------------------------------------------

interface AgentResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

function spawnAgent(
  prompt: string,
  cwd: string,
  options: Pick<RunOptions, "timeout" | "verbose">,
): Promise<AgentResult> {
  return new Promise((resolve) => {
    const child = spawn(
      "claude",
      ["-p", prompt, "--output-format", "json", "--dangerously-skip-permissions"],
      { cwd, stdio: ["pipe", "pipe", "pipe"] },
    );

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    child.stdout.on("data", (data: Buffer) => {
      const chunk = data.toString();
      stdout += chunk;
      if (options.verbose) {
        process.stdout.write(chunk);
      }
    });

    child.stderr.on("data", (data: Buffer) => {
      const chunk = data.toString();
      stderr += chunk;
      if (options.verbose) {
        process.stderr.write(chunk);
      }
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      // Grace period then SIGKILL
      setTimeout(() => {
        try {
          child.kill("SIGKILL");
        } catch {
          // Process may have already exited
        }
      }, 5000);
    }, options.timeout);

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode, timedOut });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: stderr + `\nSpawn error: ${err.message}`,
        exitCode: -1,
        timedOut: false,
      });
    });

    // Close stdin — prompt is passed as CLI arg
    child.stdin.end();
  });
}

// ---------------------------------------------------------------------------
// Brief CLI Detection
// ---------------------------------------------------------------------------

function detectBriefUsage(stdout: string, stderr: string): boolean {
  const combined = stdout + stderr;
  const briefPatterns = [
    /brief\s+ask/i,
    /brief\s+decisions/i,
    /brief\s+search/i,
    /brief\s+context/i,
    /mcp.*brief/i,
  ];
  return briefPatterns.some((p) => p.test(combined));
}

// ---------------------------------------------------------------------------
// Expected Files Gate Check
// ---------------------------------------------------------------------------

/**
 * Check if agent changes match any expected file pattern.
 * Uses diff file list (modified/created files tracked by git) plus
 * untracked new files in the worktree.
 */
function checkExpectedFiles(
  expectedPatterns: string[],
  diffFileList: string[],
  worktreePath: string,
): boolean {
  // Also check untracked files
  let untrackedFiles: string[] = [];
  try {
    const output = execSync(
      `git -C "${worktreePath}" ls-files --others --exclude-standard`,
      { encoding: "utf-8", stdio: "pipe" },
    );
    untrackedFiles = output.trim().split("\n").filter(Boolean);
  } catch {
    // Ignore
  }

  const allChangedFiles = [...diffFileList, ...untrackedFiles];

  for (const pattern of expectedPatterns) {
    const regex = globToRegex(pattern);
    if (allChangedFiles.some((f) => regex.test(f))) {
      return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Single Task Run
// ---------------------------------------------------------------------------

async function runTask(
  task: BenchmarkTask,
  config: BenchmarkConfig,
  runIndex: number,
  worktreePath: string,
  options: Pick<RunOptions, "timeout" | "verbose">,
): Promise<TaskRunResult> {
  const startTime = Date.now();

  // 1. Reset worktree to clean state
  resetWorktree(worktreePath);

  // 2. Write or remove CLAUDE.md based on config
  const claudeMdPath = path.join(worktreePath, "CLAUDE.md");
  if (config === "B") {
    fs.writeFileSync(claudeMdPath, CLAUDE_MD_CONTENT, "utf-8");
  } else if (fs.existsSync(claudeMdPath)) {
    fs.unlinkSync(claudeMdPath);
  }

  // 3. Spawn agent
  const agentResult = await spawnAgent(task.prompt, worktreePath, options);

  // 4. Capture diffs
  let diff = "";
  let diffFileList: string[] = [];
  try {
    diff = execSync(`git -C "${worktreePath}" diff`, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      stdio: "pipe",
    });
    const nameOnly = execSync(`git -C "${worktreePath}" diff --name-only`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    diffFileList = nameOnly.trim().split("\n").filter(Boolean);
  } catch {
    // Agent may not have produced any changes
  }

  // 5. Check expected files gate
  const expectedFilesMatched = checkExpectedFiles(
    task.expectedFiles,
    diffFileList,
    worktreePath,
  );

  // 6. Score
  const scoringContext: ScoringContext = { diff, diffFileList, worktreePath };
  const gotchaResults = scoreTask(task, scoringContext);

  // 7. Detect Brief CLI usage
  const briefCliInvoked = detectBriefUsage(agentResult.stdout, agentResult.stderr);

  // 8. Compute aggregate
  const earnedScore = gotchaResults
    .filter((g) => g.passed)
    .reduce((sum, g) => sum + g.weight, 0);
  const percentage = task.maxScore > 0 ? (earnedScore / task.maxScore) * 100 : 0;

  return {
    taskId: task.taskId,
    title: task.title,
    config,
    runIndex,
    gotchaResults,
    earnedScore,
    maxScore: task.maxScore,
    percentage,
    agentExitCode: agentResult.exitCode,
    agentTimedOut: agentResult.timedOut,
    agentProducedChanges: diffFileList.length > 0,
    briefCliInvoked,
    durationMs: Date.now() - startTime,
    expectedFilesMatched,
    rawDiff: diff,
    diffFileList,
    agentStdout: agentResult.stdout,
    agentStderr: agentResult.stderr,
  };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export async function runBenchmark(
  options: RunOptions,
  repoPath: string,
): Promise<TaskRunResult[]> {
  const worktreePath = createWorktree(repoPath);
  const results: TaskRunResult[] = [];

  try {
    const tasks = options.taskIds.map((id) => {
      const task = getTaskById(id);
      if (!task) throw new Error(`Unknown task: ${id}`);
      return task;
    });

    const totalRuns =
      tasks.length * options.configs.length * options.runs;
    let completed = 0;

    for (const task of tasks) {
      for (const config of options.configs) {
        for (let run = 0; run < options.runs; run++) {
          completed++;
          console.log(
            `\n[${ completed}/${totalRuns}] ${task.taskId}: ${task.title} | Config ${config} | Run ${run + 1}/${options.runs}`,
          );

          if (options.dryRun) {
            console.log(
              `  [DRY RUN] Would run: claude -p "${task.prompt.slice(0, 80)}..."`,
            );
            continue;
          }

          try {
            const result = await runTask(task, config, run, worktreePath, options);
            results.push(result);

            console.log(
              `  Score: ${result.earnedScore}/${result.maxScore} (${result.percentage.toFixed(1)}%)`,
            );
            console.log(
              `  Duration: ${(result.durationMs / 1000).toFixed(1)}s`,
            );
            if (result.agentTimedOut) console.log("  WARNING: Agent timed out");
            if (!result.agentProducedChanges)
              console.log("  WARNING: No changes produced");
            if (config === "B" && !result.briefCliInvoked)
              console.log("  WARNING: Brief CLI not detected in agent output");
          } catch (e) {
            console.error(
              `  ERROR: ${e instanceof Error ? e.message : String(e)}`,
            );
            // Push a zero-score result so the task still appears in the report
            results.push({
              taskId: task.taskId,
              title: task.title,
              config,
              runIndex: run,
              gotchaResults: [],
              earnedScore: 0,
              maxScore: task.maxScore,
              percentage: 0,
              agentExitCode: null,
              agentTimedOut: false,
              agentProducedChanges: false,
              briefCliInvoked: false,
              durationMs: Date.now(),
              expectedFilesMatched: false,
              rawDiff: "",
              diffFileList: [],
              agentStdout: "",
              agentStderr: "",
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }
      }
    }
  } finally {
    destroyWorktree(worktreePath, repoPath);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Glob-to-Regex (duplicated from scorer — lightweight, no shared dep needed)
// ---------------------------------------------------------------------------

function globToRegex(glob: string): RegExp {
  let regex = "^";
  let i = 0;

  while (i < glob.length) {
    const c = glob[i];

    if (c === "*") {
      if (glob[i + 1] === "*") {
        if (glob[i + 2] === "/") {
          regex += "(?:.+/)?";
          i += 3;
        } else {
          regex += ".*";
          i += 2;
        }
      } else {
        regex += "[^/]*";
        i++;
      }
    } else if (c === "?") {
      regex += "[^/]";
      i++;
    } else if (c === ".") {
      regex += "\\.";
      i++;
    } else if (c === "{") {
      const closeBrace = glob.indexOf("}", i);
      if (closeBrace > i) {
        const alternatives = glob.slice(i + 1, closeBrace).split(",");
        regex += `(?:${alternatives.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`;
        i = closeBrace + 1;
      } else {
        regex += "\\{";
        i++;
      }
    } else {
      regex += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      i++;
    }
  }

  regex += "$";
  return new RegExp(regex);
}
