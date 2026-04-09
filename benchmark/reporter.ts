/**
 * Benchmark Report Generation
 *
 * Produces JSON result files and Markdown comparison reports.
 */

import * as fs from "fs";
import * as path from "path";

import type {
  BenchmarkConfig,
  BenchmarkReport,
  BenchmarkSummary,
  ConfigSummary,
  RunOptions,
  TaskRunResult,
} from "./types";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateReport(
  results: TaskRunResult[],
  options: RunOptions,
): BenchmarkReport {
  const summary = computeSummary(results, options.configs);
  return {
    timestamp: new Date().toISOString(),
    options,
    results,
    summary,
  };
}

export function ensureResultsDir(outputDir: string): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

export function writeJsonReport(
  report: BenchmarkReport,
  outputDir: string,
): string {
  const ts = report.timestamp.replace(/[:.]/g, "-");
  const filePath = path.join(outputDir, `run-${ts}.json`);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), "utf-8");
  return filePath;
}

export function writeMarkdownReport(
  report: BenchmarkReport,
  outputDir: string,
): string {
  const ts = report.timestamp.replace(/[:.]/g, "-");
  const filePath = path.join(outputDir, `comparison-${ts}.md`);
  const md = buildMarkdown(report);
  fs.writeFileSync(filePath, md, "utf-8");
  return filePath;
}

// ---------------------------------------------------------------------------
// Summary Computation
// ---------------------------------------------------------------------------

function computeConfigSummary(
  results: TaskRunResult[],
  config: BenchmarkConfig,
): ConfigSummary {
  const configResults = results.filter((r) => r.config === config);
  if (configResults.length === 0) {
    return {
      config,
      totalEarned: 0,
      totalMax: 0,
      percentage: 0,
      tasksRun: 0,
      tasksPassed: 0,
      avgDurationMs: 0,
      briefCliUsageCount: 0,
      gotchaPassRate: 0,
    };
  }

  const totalEarned = configResults.reduce((s, r) => s + r.earnedScore, 0);
  const totalMax = configResults.reduce((s, r) => s + r.maxScore, 0);
  const tasksPassed = configResults.filter((r) => r.percentage > 50).length;
  const avgDurationMs =
    configResults.reduce((s, r) => s + r.durationMs, 0) / configResults.length;
  const allGotchas = configResults.flatMap((r) => r.gotchaResults);
  const gotchaPassRate =
    allGotchas.length > 0
      ? (allGotchas.filter((g) => g.passed).length / allGotchas.length) * 100
      : 0;
  const briefUsage = configResults.filter((r) => r.briefCliInvoked).length;

  return {
    config,
    totalEarned,
    totalMax,
    percentage: totalMax > 0 ? (totalEarned / totalMax) * 100 : 0,
    tasksRun: configResults.length,
    tasksPassed,
    avgDurationMs,
    briefCliUsageCount: briefUsage,
    gotchaPassRate,
  };
}

function computeSummary(
  results: TaskRunResult[],
  configs: BenchmarkConfig[],
): BenchmarkSummary {
  const summary: BenchmarkSummary = {};

  if (configs.includes("A")) {
    summary.configA = computeConfigSummary(results, "A");
  }
  if (configs.includes("B")) {
    summary.configB = computeConfigSummary(results, "B");
  }
  if (summary.configA && summary.configB) {
    summary.liftPercentage =
      summary.configB.percentage - summary.configA.percentage;
  }

  return summary;
}

// ---------------------------------------------------------------------------
// Markdown Builder
// ---------------------------------------------------------------------------

function buildMarkdown(report: BenchmarkReport): string {
  const lines: string[] = [];
  const { summary, options, results } = report;

  lines.push(`# Benchmark Results — ${report.timestamp}`);
  lines.push("");

  // Configuration section
  lines.push("## Configuration");
  lines.push(`- **Configs**: ${options.configs.join(", ")}`);
  lines.push(`- **Tasks**: ${options.taskIds.length} tasks, ${options.runs} run(s) each`);
  lines.push(`- **Timeout**: ${options.timeout / 1000}s per task`);
  lines.push("");

  // Summary table
  lines.push("## Summary");
  lines.push("");

  if (summary.configA && summary.configB) {
    lines.push("| Metric | Config A (No Brief) | Config B (With Brief) | Delta |");
    lines.push("|--------|--------------------|-----------------------|-------|");
    lines.push(
      `| **Total Score** | ${summary.configA.totalEarned}/${summary.configA.totalMax} (${summary.configA.percentage.toFixed(1)}%) | ${summary.configB.totalEarned}/${summary.configB.totalMax} (${summary.configB.percentage.toFixed(1)}%) | ${fmtDelta(summary.liftPercentage)}% |`,
    );
    lines.push(
      `| **Tasks Passed (>50%)** | ${summary.configA.tasksPassed}/${summary.configA.tasksRun} | ${summary.configB.tasksPassed}/${summary.configB.tasksRun} | ${fmtDelta(summary.configB.tasksPassed - summary.configA.tasksPassed)} |`,
    );
    lines.push(
      `| **Gotcha Pass Rate** | ${summary.configA.gotchaPassRate.toFixed(1)}% | ${summary.configB.gotchaPassRate.toFixed(1)}% | ${fmtDelta(summary.configB.gotchaPassRate - summary.configA.gotchaPassRate)}% |`,
    );
    lines.push(
      `| **Avg Duration** | ${(summary.configA.avgDurationMs / 1000).toFixed(1)}s | ${(summary.configB.avgDurationMs / 1000).toFixed(1)}s | — |`,
    );
    lines.push(
      `| **Brief CLI Used** | N/A | ${summary.configB.briefCliUsageCount}/${summary.configB.tasksRun} tasks | — |`,
    );
  } else {
    const s = summary.configA || summary.configB;
    if (s) {
      lines.push(`| Metric | Config ${s.config} |`);
      lines.push(`|--------|----------|`);
      lines.push(
        `| **Total Score** | ${s.totalEarned}/${s.totalMax} (${s.percentage.toFixed(1)}%) |`,
      );
      lines.push(`| **Tasks Passed (>50%)** | ${s.tasksPassed}/${s.tasksRun} |`);
      lines.push(`| **Gotcha Pass Rate** | ${s.gotchaPassRate.toFixed(1)}% |`);
      lines.push(
        `| **Avg Duration** | ${(s.avgDurationMs / 1000).toFixed(1)}s |`,
      );
      if (s.config === "B") {
        lines.push(
          `| **Brief CLI Used** | ${s.briefCliUsageCount}/${s.tasksRun} tasks |`,
        );
      }
    }
  }

  lines.push("");

  // Per-task breakdown
  lines.push("## Per-Task Breakdown");
  lines.push("");

  // Group results by task
  const taskIds = Array.from(new Set(results.map((r) => r.taskId)));

  for (const taskId of taskIds) {
    const taskResults = results.filter((r) => r.taskId === taskId);
    const firstResult = taskResults[0];

    lines.push(
      `### ${taskId}: ${firstResult.title}`,
    );
    lines.push("");

    // Gotcha table header depends on configs
    const hasA = taskResults.some((r) => r.config === "A");
    const hasB = taskResults.some((r) => r.config === "B");

    if (hasA && hasB) {
      lines.push("| Gotcha | Decision | Weight | Config A | Config B |");
      lines.push("|--------|----------|--------|----------|----------|");

      // Use first run per config for the breakdown
      const resultA = taskResults.find((r) => r.config === "A");
      const resultB = taskResults.find((r) => r.config === "B");

      const gotchaIds = Array.from(new Set([
        ...(resultA?.gotchaResults.map((g) => g.gotchaId) || []),
        ...(resultB?.gotchaResults.map((g) => g.gotchaId) || []),
      ]));

      for (const gId of gotchaIds) {
        const gA = resultA?.gotchaResults.find((g) => g.gotchaId === gId);
        const gB = resultB?.gotchaResults.find((g) => g.gotchaId === gId);
        const weight = gA?.weight || gB?.weight || 0;
        const decisionId = gA?.decisionId || gB?.decisionId || "—";

        lines.push(
          `| ${gId} | ${decisionId} | ${weight} | ${fmtPassFail(gA)} | ${fmtPassFail(gB)} |`,
        );
      }

      const scoreA = resultA
        ? `${resultA.earnedScore}/${resultA.maxScore} (${resultA.percentage.toFixed(0)}%)`
        : "—";
      const scoreB = resultB
        ? `${resultB.earnedScore}/${resultB.maxScore} (${resultB.percentage.toFixed(0)}%)`
        : "—";
      lines.push(`| **Total** | | | **${scoreA}** | **${scoreB}** |`);
    } else {
      const config = hasA ? "A" : "B";
      lines.push(`| Gotcha | Decision | Weight | Config ${config} |`);
      lines.push("|--------|----------|--------|----------|");

      const result = taskResults[0];
      for (const g of result.gotchaResults) {
        lines.push(
          `| ${g.gotchaId} | ${g.decisionId} | ${g.weight} | ${fmtPassFail(g)} |`,
        );
      }
      lines.push(
        `| **Total** | | | **${result.earnedScore}/${result.maxScore} (${result.percentage.toFixed(0)}%)** |`,
      );
    }

    lines.push("");
  }

  // Per-decision analysis
  lines.push("## Per-Decision Analysis");
  lines.push("");

  const decisionMap = new Map<
    string,
    { configA: { passed: number; total: number }; configB: { passed: number; total: number } }
  >();

  for (const r of results) {
    for (const g of r.gotchaResults) {
      if (!decisionMap.has(g.decisionId)) {
        decisionMap.set(g.decisionId, {
          configA: { passed: 0, total: 0 },
          configB: { passed: 0, total: 0 },
        });
      }
      const entry = decisionMap.get(g.decisionId)!;
      const bucket = r.config === "A" ? entry.configA : entry.configB;
      bucket.total++;
      if (g.passed) bucket.passed++;
    }
  }

  if (summary.configA && summary.configB) {
    lines.push("| Decision | Config A Pass Rate | Config B Pass Rate | Delta |");
    lines.push("|----------|--------------------|--------------------|-------|");
  } else {
    lines.push("| Decision | Pass Rate |");
    lines.push("|----------|-----------|");
  }

  for (const [decisionId, data] of Array.from(decisionMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    if (summary.configA && summary.configB) {
      const rateA =
        data.configA.total > 0
          ? `${data.configA.passed}/${data.configA.total}`
          : "—";
      const rateB =
        data.configB.total > 0
          ? `${data.configB.passed}/${data.configB.total}`
          : "—";
      const pctA =
        data.configA.total > 0
          ? (data.configA.passed / data.configA.total) * 100
          : 0;
      const pctB =
        data.configB.total > 0
          ? (data.configB.passed / data.configB.total) * 100
          : 0;
      lines.push(
        `| ${decisionId} | ${rateA} | ${rateB} | ${fmtDelta(pctB - pctA)}% |`,
      );
    } else {
      const config = summary.configA ? data.configA : data.configB;
      const rate =
        config.total > 0 ? `${config.passed}/${config.total}` : "—";
      lines.push(`| ${decisionId} | ${rate} |`);
    }
  }

  lines.push("");

  // Detailed results (collapsible)
  lines.push("## Detailed Results");
  lines.push("");

  for (const r of results) {
    lines.push(`<details>`);
    lines.push(
      `<summary>${r.taskId} Config ${r.config} Run ${r.runIndex + 1} — ${r.earnedScore}/${r.maxScore} (${r.percentage.toFixed(0)}%)</summary>`,
    );
    lines.push("");
    lines.push(`- **Exit code**: ${r.agentExitCode ?? "N/A"}`);
    lines.push(`- **Duration**: ${(r.durationMs / 1000).toFixed(1)}s`);
    lines.push(`- **Timed out**: ${r.agentTimedOut ? "Yes" : "No"}`);
    lines.push(`- **Changes**: ${r.diffFileList.length > 0 ? r.diffFileList.join(", ") : "None"}`);
    lines.push(`- **Brief CLI used**: ${r.briefCliInvoked ? "Yes" : "No"}`);
    lines.push(`- **Expected files matched**: ${r.expectedFilesMatched ? "Yes" : "No"}`);
    if (r.error) {
      lines.push(`- **Error**: ${r.error}`);
    }
    lines.push("");

    lines.push("**Gotcha results:**");
    lines.push("");
    for (const g of r.gotchaResults) {
      const status = g.passed ? "PASS" : "FAIL";
      const details: string[] = [];
      if (g.passCheckMatched) details.push("pass matched");
      if (g.failCheckMatched) details.push("fail matched");
      if (g.error) details.push(`error: ${g.error}`);
      if (details.length === 0) details.push("no checks matched");
      lines.push(`- ${g.gotchaId}: **${status}** (${details.join(", ")})`);
    }
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDelta(n: number | undefined): string {
  if (n === undefined) return "—";
  return n >= 0 ? `+${n.toFixed(1)}` : n.toFixed(1);
}

function fmtPassFail(g: { passed: boolean } | undefined): string {
  if (!g) return "—";
  return g.passed ? "PASS" : "FAIL";
}
