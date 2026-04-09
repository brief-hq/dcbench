#!/usr/bin/env npx tsx
/**
 * Benchmark Harness — CLI Entry Point
 *
 * Usage:
 *   npx tsx benchmark/run.ts                          # Run all tasks, both configs
 *   npx tsx benchmark/run.ts --config A               # Config A only
 *   npx tsx benchmark/run.ts --tasks 1,3,5            # Subset of tasks
 *   npx tsx benchmark/run.ts --dry-run                # Print plan without executing
 *   npx tsx benchmark/run.ts --runs 3 --timeout 600   # 3 runs, 10 min timeout
 *   npx tsx benchmark/run.ts --verbose                 # Show agent stdout in real-time
 */

import * as path from "path";

import { BENCHMARK_TASKS, getTaskById } from "./tasks";
import {
  checkClaudeCli,
  checkBriefCli,
  checkSeedData,
  runBenchmark,
} from "./runner";
import {
  generateReport,
  ensureResultsDir,
  writeJsonReport,
  writeMarkdownReport,
} from "./reporter";
import type { BenchmarkConfig, RunOptions } from "./types";

// ---------------------------------------------------------------------------
// CLI Argument Parsing
// ---------------------------------------------------------------------------

function getArgValue(args: string[], flag: string): string | undefined {
  // --flag=value
  const eqArg = args.find((a) => a.startsWith(`${flag}=`));
  if (eqArg) return eqArg.split("=").slice(1).join("=");

  // --flag value
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length && !args[idx + 1].startsWith("--")) {
    return args[idx + 1];
  }

  return undefined;
}

function parseArgs(): RunOptions {
  const args = process.argv.slice(2);

  // --config A|B|both (default: both)
  const configArg = getArgValue(args, "--config") || "both";
  let configs: BenchmarkConfig[];
  if (configArg === "both") {
    configs = ["A", "B"];
  } else if (configArg === "A" || configArg === "B") {
    configs = [configArg];
  } else {
    console.error(`Invalid --config: ${configArg}. Must be A, B, or both.`);
    process.exit(1);
  }

  // --tasks all|1,2,3 (default: all)
  const tasksArg = getArgValue(args, "--tasks") || "all";
  let taskIds: string[];
  if (tasksArg === "all") {
    taskIds = BENCHMARK_TASKS.map((t) => t.taskId);
  } else {
    taskIds = tasksArg.split(",").map((id) => {
      const trimmed = id.trim();
      // Allow "1" as shorthand for "TASK-001"
      if (/^\d+$/.test(trimmed)) {
        return `TASK-${trimmed.padStart(3, "0")}`;
      }
      return trimmed;
    });
    // Validate
    for (const id of taskIds) {
      if (!getTaskById(id)) {
        console.error(`Unknown task ID: ${id}`);
        process.exit(1);
      }
    }
  }

  // --runs N (default: 1)
  const runs = parseInt(getArgValue(args, "--runs") || "1", 10);
  if (isNaN(runs) || runs < 1) {
    console.error("--runs must be a positive integer.");
    process.exit(1);
  }

  // --timeout N in seconds (default: 300)
  const timeoutSec = parseInt(getArgValue(args, "--timeout") || "300", 10);
  if (isNaN(timeoutSec) || timeoutSec < 1) {
    console.error("--timeout must be a positive integer (seconds).");
    process.exit(1);
  }

  // --dry-run
  const dryRun = args.includes("--dry-run");

  // --verbose
  const verbose = args.includes("--verbose");

  return {
    configs,
    taskIds,
    runs,
    dryRun,
    timeout: timeoutSec * 1000,
    verbose,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const options = parseArgs();
  const repoPath = path.resolve(__dirname, "..");

  console.log("=== Brief Benchmark Harness ===");
  console.log(`Configs:  ${options.configs.join(", ")}`);
  console.log(`Tasks:    ${options.taskIds.length} (${options.taskIds.join(", ")})`);
  console.log(`Runs:     ${options.runs} per task per config`);
  console.log(`Timeout:  ${options.timeout / 1000}s`);
  console.log(`Dry run:  ${options.dryRun}`);
  console.log(`Verbose:  ${options.verbose}`);
  console.log("");

  // Preflight checks (skip in dry-run)
  if (!options.dryRun) {
    // Always need claude CLI
    checkClaudeCli();

    // Config B needs brief CLI + seed data
    if (options.configs.includes("B")) {
      checkBriefCli();
      checkSeedData(repoPath);
    }
  }

  // Dry-run mode: print plan and exit
  if (options.dryRun) {
    console.log("--- Dry Run Plan ---\n");
    for (const taskId of options.taskIds) {
      const task = getTaskById(taskId)!;
      for (const config of options.configs) {
        for (let i = 0; i < options.runs; i++) {
          console.log(
            `${task.taskId} | Config ${config} | Run ${i + 1}/${options.runs}`,
          );
          console.log(`  Title:   ${task.title}`);
          console.log(
            `  Prompt:  "${task.prompt.slice(0, 100)}${task.prompt.length > 100 ? "..." : ""}"`,
          );
          console.log(
            `  Gotchas: ${task.gotchas.length} (max score: ${task.maxScore})`,
          );
          if (config === "B") console.log("  CLAUDE.md: will be written");
          console.log("");
        }
      }
    }
    console.log("Dry run complete. No agents were executed.");
    return;
  }

  // Run benchmark
  const results = await runBenchmark(options, repoPath);

  // Generate reports
  const outputDir = path.resolve(__dirname, "results");
  ensureResultsDir(outputDir);

  const report = generateReport(results, options);
  const jsonPath = writeJsonReport(report, outputDir);
  const mdPath = writeMarkdownReport(report, outputDir);

  console.log("\n=== Benchmark Complete ===");
  console.log(`JSON report:     ${jsonPath}`);
  console.log(`Markdown report: ${mdPath}`);

  if (report.summary.configA && report.summary.configB) {
    console.log("");
    console.log(
      `Config A (No Brief):   ${report.summary.configA.percentage.toFixed(1)}%`,
    );
    console.log(
      `Config B (With Brief): ${report.summary.configB.percentage.toFixed(1)}%`,
    );
    console.log(
      `Lift:                  ${report.summary.liftPercentage?.toFixed(1)}%`,
    );
  } else if (report.summary.configA || report.summary.configB) {
    const s = report.summary.configA || report.summary.configB;
    if (s) {
      console.log(`\nConfig ${s.config}: ${s.percentage.toFixed(1)}%`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
