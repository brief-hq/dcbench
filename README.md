# Decision Compliance Benchmark (dcbench)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Paper](https://img.shields.io/badge/Paper-Context--Augmented%20Code%20Generation-blue)](https://briefhq.ai/assets/pdf/Context_Augmented_Code_Generation.pdf)

**How Product Context Improves AI Coding Agent Decision Compliance by 49%**

This repository contains the benchmark suite, test application, and scoring harness from the paper *"Context-Augmented Code Generation"* by Drew Dillon and Kasyap Varanasi ([Brief](https://briefhq.ai)).

## Key Finding

AI coding agents with access to product context achieve **95% decision compliance** versus **46%** for agents with codebase access alone—a **49 percentage point improvement**.

| Metric | Claude Code | Claude Code + Brief | Delta |
|--------|-------------|---------------------|-------|
| Decision Compliance | 19/41 (46%) | 39/41 (95%) | **+49%** |
| Tasks at 100% | 2/8 | 6/8 | +4 tasks |
| Blocking Violations | 5 | 0 | -100% |
| Merge-Ready | 25% | 100% | +75% |
| Cost per Merge-Ready Task | $2.07 | $0.66 | **-68%** |

## What This Benchmark Measures

**Decision compliance**: the rate at which an AI coding agent follows established product, design, and engineering decisions.

Real engineering teams accumulate decisions over time: which UI components are canonical vs. deprecated, which middleware wrappers are mandatory for compliance, which patterns are preferred. These decisions are often recorded in product tools but rarely appear in the codebase itself.

This creates a fundamental information asymmetry. An agent with codebase access alone must infer team intent from code patterns. When the decision is invisible, the agent defaults to whatever pattern it encounters first.

## Repository Structure

```
├── benchmark/           # Benchmark harness, runner, scorer, and seed data
│   ├── run.ts           # CLI entry point
│   ├── runner.ts        # Task execution with git isolation
│   ├── scorer.ts        # Decision compliance scoring
│   ├── tasks.ts         # 8 benchmark task definitions
│   ├── seed.ts          # Seeds Brief workspace with test data
│   └── seed-data.ts     # Product decisions, personas, signals, competitors
├── src/                 # Prism Analytics - Next.js 14 test application
│   ├── app/             # App router pages and API routes
│   ├── components/      # React UI components
│   └── lib/             # Database access and utilities
└── drizzle.config.ts    # Database configuration
```

## The Test Application: Prism Analytics

A clean-room Next.js 14 application with Drizzle ORM and SQLite containing realistic production patterns:

- Authentication middleware
- Pagination helpers
- Design system components
- Audit logging utilities

**15 product decisions** (D-001 through D-015) are seeded across 5 categories: Technical (6), Design (4), Product (2), Process (1), General (1). Plus 3 personas, 5 customer signals, and 3 competitor profiles.

## Benchmark Tasks

| Task | Description | Points | Gotcha Decisions |
|------|-------------|--------|------------------|
| TASK-001 | CSV Export to Dashboard | 6 | D-002 (wt 3), D-001 (wt 2), D-003 (wt 1) |
| TASK-003 | Cursor Pagination to Users API | 5 | D-004 (wt 2), D-010 (wt 3) |
| TASK-004 | Notification Preferences Page | 4 | D-011 (wt 2), D-008 (wt 2) |
| TASK-006 | Dark Mode Toggle to Settings | 4 | D-009 (wt 1), D-014 (wt 3) |
| TASK-008 | Bulk Delete for Admin Dashboard | 4 | D-003 (wt 1), D-002 (wt 3) |
| TASK-009 | Search to API Endpoints | 7 | D-010 (wt 3), D-004 (wt 2), D-013 (wt 2) |
| TASK-012 | Rate Limiting to API Routes | 6 | D-010 (wt 3), D-006 (wt 3) |
| TASK-013 | Export Audit Log Viewer | 5 | D-002 (wt 3), D-005 (wt 2) |

## What Is a "Gotcha"?

A **gotcha** is a product decision that a coding agent will naturally get wrong without product context.

**Example**: TASK-001 asks the agent to "add a CSV export button to the analytics dashboard." The gotchas:

- **D-002 (weight 3, blocking)**: Export must use `withAuditLog()` for SOC-2 compliance. The function exists but nothing says it's *required*.
- **D-001 (weight 2)**: Use `DateRangePicker`, not `CalendarRange`. But `CalendarRange` is still imported elsewhere—a trap.
- **D-003 (weight 1)**: Use `variant="secondary"` (read-only), not `variant="primary"` (mutations).

An agent scoring 0/6 builds a *working* CSV export that fails SOC-2 audit, uses a deprecated component, and has incorrect styling. It compiles. It runs. **It is wrong.**

## Configurations

### Config A: Claude Code (Baseline)
```bash
claude -p <prompt> --output-format json --dangerously-skip-permissions
```
- Full codebase access, **no product context**

### Config B: Claude Code + Brief
```bash
brief build --confirm <prompt>
```
- Product context retrieval via Brief tools
- Spec generation with acceptance criteria
- Mid-build consultations

## Running the Benchmark

### Prerequisites

- Node.js 18+
- Claude Code CLI
- Brief CLI (for Config B)

### Setup

```bash
git clone https://github.com/brief-hq/dcbench.git
cd dcbench
npm install
cp .env.example .env.local
npm run db:push
```

### Seed Brief Workspace (Config B only)

```bash
npx tsx benchmark/seed.ts --api-url https://app.briefhq.com --api-key <your-key>
```

### Run Tasks

```bash
# Single task
npx tsx benchmark/run.ts --task TASK-001 --config A

# All tasks, both configs, 3 runs each
npx tsx benchmark/run.ts --all --configs A,B --runs 3
```

## Per-Decision Results

| ID | Decision | Claude Code | CC + Brief | Visible in Code? |
|----|----------|-------------|------------|------------------|
| D-001 | DateRangePicker | 100% | 100% | Yes |
| D-002 | Audit log (SOC-2) | 33% | 100% | Partial |
| D-008 | PostHog feature flags | **0%** | 100% | **No** |
| D-014 | @t3-oss/env-nextjs | **0%** | 100% | **No** |

The pattern: 100% on decisions visible in code, 0-33% on decisions requiring product context.

## Scoring

1. **Automated**: Regex pattern matching against git diffs
2. **LLM-as-judge**: Claude scores PRs on 5 rubrics (0-5 each)
3. **Human verification**: Blind review of all PRs

Each task runs 3 times per configuration to account for non-deterministic behavior.

## Limitations

- Decisions designed to create measurable gap; real-world distributions may differ
- 8 tasks, 1 repository, 1 model family (Claude)
- Results tied to Brief's architecture

This is a **proof-of-concept benchmark**, not a definitive field result.

## Citation

```bibtex
@article{dillon2025context,
  title={Context-Augmented Code Generation: How Product Context Improves
         AI Coding Agent Decision Compliance by 49\%},
  author={Dillon, Drew and Varanasi, Kasyap},
  year={2025}
}
```

## Links

- **Paper**: [Context-Augmented Code Generation](https://briefhq.ai/assets/pdf/Context_Augmented_Code_Generation.pdf)
- **Brief**: [https://briefhq.ai](https://briefhq.ai)

## License

MIT - see [LICENSE](LICENSE)

---

**Authors**: Drew Dillon (drew@briefhq.ai), Kasyap Varanasi (kasyap@briefhq.ai)
