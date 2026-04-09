/**
 * Benchmark Scoring Engine
 *
 * Evaluates agent output against task gotcha rubrics.
 * Implements all five GotchaCheckType evaluators and the weighted scoring algorithm.
 */

import { execSync } from "child_process";
import type { BenchmarkTask, Gotcha, GotchaCheck } from "./tasks";
import type { GotchaResult } from "./types";

// ---------------------------------------------------------------------------
// Scoring Context — gathered after agent finishes
// ---------------------------------------------------------------------------

export interface ScoringContext {
  /** Full `git diff` output (unstaged changes in worktree). */
  diff: string;
  /** File paths from `git diff --name-only`. */
  diffFileList: string[];
  /** Absolute path to the worktree root. */
  worktreePath: string;
}

// ---------------------------------------------------------------------------
// Check Evaluators
// ---------------------------------------------------------------------------

/**
 * grep_diff: Apply regex against raw diff lines.
 * Task patterns include `^\+` anchors so we test against raw lines directly.
 * When `target` is specified, scope the diff via `git diff -- <target>`.
 */
function evaluateGrepDiff(
  pattern: string,
  target: string | undefined,
  context: ScoringContext,
): boolean {
  let diffText = context.diff;

  if (target) {
    try {
      diffText = execSync(`git diff -- "${target}"`, {
        cwd: context.worktreePath,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch {
      // If git diff fails (e.g. no matching files), treat as empty diff
      diffText = "";
    }
  }

  const regex = new RegExp(pattern, "m");
  const lines = diffText.split("\n");
  return lines.some((line) => regex.test(line));
}

/**
 * grep_tree: Apply regex against file content in the worktree after agent changes.
 * Scoped by `target` glob. If no target, searches all files (rare).
 */
function evaluateGrepTree(
  pattern: string,
  target: string | undefined,
  worktreePath: string,
): boolean {
  const globPattern = target || "**/*";
  let files: string[];

  try {
    const output = execSync(
      `find . -path "./.git" -prune -o -path "./node_modules" -prune -o -type f -print`,
      { cwd: worktreePath, encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
    );
    files = output.trim().split("\n").filter(Boolean);

    // Filter by target glob if specified
    if (target) {
      const globRegex = globToRegex(target);
      files = files.filter((f) => {
        const normalized = f.startsWith("./") ? f.slice(2) : f;
        return globRegex.test(normalized);
      });
    }
  } catch {
    return false;
  }

  const regex = new RegExp(pattern, "m");
  const { readFileSync } = require("fs") as typeof import("fs");
  const { join } = require("path") as typeof import("path");

  for (const file of files) {
    try {
      const fullPath = join(worktreePath, file);
      const content = readFileSync(fullPath, "utf-8");
      if (regex.test(content)) return true;
    } catch {
      // Skip unreadable files (binary, permissions, etc.)
    }
  }

  return false;
}

/**
 * file_exists: Check if any file matching the glob pattern exists in the worktree.
 */
function evaluateFileExists(
  pattern: string,
  worktreePath: string,
): boolean {
  try {
    const globRegex = globToRegex(pattern);
    const output = execSync(
      `find . -path "./.git" -prune -o -path "./node_modules" -prune -o -type f -print`,
      { cwd: worktreePath, encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
    );
    const files = output.trim().split("\n").filter(Boolean);
    return files.some((f) => {
      const normalized = f.startsWith("./") ? f.slice(2) : f;
      return globRegex.test(normalized);
    });
  } catch {
    return false;
  }
}

/**
 * file_not_exists: Check that NO file matching the glob pattern exists.
 */
function evaluateFileNotExists(
  pattern: string,
  worktreePath: string,
): boolean {
  return !evaluateFileExists(pattern, worktreePath);
}

/**
 * file_not_modified: Check that a specific file was NOT changed in the diff.
 * The pattern is a file path like "src/lib/auth/middleware.ts".
 */
function evaluateFileNotModified(
  pattern: string,
  diffFileList: string[],
): boolean {
  return !diffFileList.includes(pattern);
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

function evaluateCheck(
  check: GotchaCheck,
  context: ScoringContext,
): boolean {
  switch (check.check) {
    case "grep_diff":
      return evaluateGrepDiff(check.pattern, check.target, context);
    case "grep_tree":
      return evaluateGrepTree(check.pattern, check.target, context.worktreePath);
    case "file_exists":
      return evaluateFileExists(check.pattern, context.worktreePath);
    case "file_not_exists":
      return evaluateFileNotExists(check.pattern, context.worktreePath);
    case "file_not_modified":
      return evaluateFileNotModified(check.pattern, context.diffFileList);
    default:
      throw new Error(`Unknown check type: ${(check as GotchaCheck).check}`);
  }
}

// ---------------------------------------------------------------------------
// Gotcha Scoring
// ---------------------------------------------------------------------------

function scoreGotcha(gotcha: Gotcha, context: ScoringContext): GotchaResult {
  let passCheckMatched = false;
  let failCheckMatched = false;
  let error: string | undefined;

  try {
    if (gotcha.pass) {
      passCheckMatched = evaluateCheck(gotcha.pass, context);
    }
  } catch (e) {
    error = `Pass check error: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    if (gotcha.fail) {
      failCheckMatched = evaluateCheck(gotcha.fail, context);
    }
  } catch (e) {
    const msg = `Fail check error: ${e instanceof Error ? e.message : String(e)}`;
    error = error ? `${error}; ${msg}` : msg;
  }

  // Scoring logic:
  // - Has only fail (no pass): passes if fail does NOT match (avoid-the-trap)
  // - Has only pass (no fail): passes if pass matches
  // - Has both: passes if pass matches AND fail doesn't (fail takes precedence)
  let passed: boolean;
  if (!gotcha.pass && gotcha.fail) {
    passed = !failCheckMatched;
  } else {
    passed = passCheckMatched && !failCheckMatched;
  }

  return {
    gotchaId: gotcha.id,
    decisionId: gotcha.decisionId,
    description: gotcha.description,
    weight: gotcha.weight,
    passed,
    passCheckMatched,
    failCheckMatched,
    error,
  };
}

// ---------------------------------------------------------------------------
// Task Scoring (public API)
// ---------------------------------------------------------------------------

/**
 * Score all gotchas for a single task run.
 * Returns per-gotcha results; caller computes aggregate.
 */
export function scoreTask(
  task: BenchmarkTask,
  context: ScoringContext,
): GotchaResult[] {
  return task.gotchas.map((gotcha) => scoreGotcha(gotcha, context));
}

// ---------------------------------------------------------------------------
// Glob-to-Regex Utility
// ---------------------------------------------------------------------------

/**
 * Convert a simple glob pattern to a RegExp.
 * Supports `*` (any segment chars), `**` (any path), `?` (single char).
 */
function globToRegex(glob: string): RegExp {
  let regex = "^";
  let i = 0;

  while (i < glob.length) {
    const c = glob[i];

    if (c === "*") {
      if (glob[i + 1] === "*") {
        // ** matches any path segments
        if (glob[i + 2] === "/") {
          regex += "(?:.+/)?";
          i += 3;
        } else {
          regex += ".*";
          i += 2;
        }
      } else {
        // * matches anything except /
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
      // Handle {a,b} alternation
      const closeBrace = glob.indexOf("}", i);
      if (closeBrace > i) {
        const alternatives = glob.slice(i + 1, closeBrace).split(",");
        regex += `(?:${alternatives.map(escapeRegex).join("|")})`;
        i = closeBrace + 1;
      } else {
        regex += "\\{";
        i++;
      }
    } else {
      regex += escapeRegex(c);
      i++;
    }
  }

  regex += "$";
  return new RegExp(regex);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
