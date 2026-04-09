/**
 * Benchmark Harness — Shared Types
 *
 * Result types consumed by scorer, runner, reporter, and CLI entry point.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export type BenchmarkConfig = "A" | "B";

export interface RunOptions {
  configs: BenchmarkConfig[];
  taskIds: string[];
  runs: number;
  dryRun: boolean;
  timeout: number; // milliseconds
  verbose: boolean;
}

// ---------------------------------------------------------------------------
// Scoring Results
// ---------------------------------------------------------------------------

export interface GotchaResult {
  gotchaId: string;
  decisionId: string;
  description: string;
  weight: 1 | 2 | 3;
  passed: boolean;
  passCheckMatched: boolean;
  failCheckMatched: boolean;
  error?: string;
}

export interface TaskRunResult {
  taskId: string;
  title: string;
  config: BenchmarkConfig;
  runIndex: number;
  gotchaResults: GotchaResult[];
  earnedScore: number;
  maxScore: number;
  percentage: number;
  agentExitCode: number | null;
  agentTimedOut: boolean;
  agentProducedChanges: boolean;
  briefCliInvoked: boolean;
  durationMs: number;
  expectedFilesMatched: boolean;
  rawDiff: string;
  diffFileList: string[];
  agentStdout: string;
  agentStderr: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export interface ConfigSummary {
  config: BenchmarkConfig;
  totalEarned: number;
  totalMax: number;
  percentage: number;
  tasksRun: number;
  tasksPassed: number;
  avgDurationMs: number;
  briefCliUsageCount: number;
  gotchaPassRate: number;
}

export interface BenchmarkSummary {
  configA?: ConfigSummary;
  configB?: ConfigSummary;
  liftPercentage?: number;
}

export interface BenchmarkReport {
  timestamp: string;
  options: RunOptions;
  results: TaskRunResult[];
  summary: BenchmarkSummary;
}
