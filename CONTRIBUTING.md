# Contributing to dcbench

We welcome contributions that help improve the benchmark or extend it to new contexts.

## Ways to Contribute

### Reproduce the Results
The most valuable contribution is independent reproduction. Run the benchmark on your own setup and report your findings.

### Add New Tasks
If you have realistic software engineering tasks with "gotcha" decisions, we'd love to include them:

1. Define the task in `benchmark/tasks.ts`
2. Add corresponding seed data in `benchmark/seed-data.ts`
3. Include pass/fail regex patterns for automated scoring
4. Document the gotcha decisions and their weights

### Extend to Other Agents
The benchmark currently tests Claude Code. Extending to other AI coding agents (Copilot, Cursor, Devin, etc.) would strengthen the findings.

### Improve the Harness
Bug fixes and improvements to the benchmark runner, scorer, or reporter are welcome.

## Development Setup

```bash
git clone https://github.com/brief-hq/dcbench.git
cd dcbench
npm install
cp .env.example .env.local
npm run db:push
```

## Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-contribution`)
3. Make your changes
4. Run the existing tests (`npm test`)
5. Submit a pull request

## Code Style

- TypeScript for benchmark harness code
- Follow existing patterns in the codebase
- Include tests for new functionality

## Questions?

Open an issue or reach out to the maintainers.
