/**
 * CLAUDE.md Template for Config B
 *
 * General-purpose instructions that tell the coding agent to consult Brief
 * before making changes. Does NOT hint at specific tasks or gotchas.
 */

export const CLAUDE_MD_CONTENT = `# Project Context

This codebase is part of the Prism Analytics platform. Before making any changes,
you MUST consult Brief for product context and decisions.

## Required Before Any Code Change

1. **Search for relevant decisions**: Run \`brief decisions search "<topic>"\` to find
   any product decisions that apply to what you're building.

2. **Ask Brief for guidance**: Run \`brief ask "<your question about the task>"\` to get
   product context, design system conventions, and compliance requirements.

3. **Validate your approach**: Run \`brief ask --mode check "<what you plan to do>"\` to
   verify your approach against existing decisions before writing code.

## Key Areas to Always Check

- **UI Components**: Search for design system decisions before picking components
- **API Patterns**: Search for API conventions (pagination, auth, validation)
- **Compliance**: Search for audit/security requirements before data operations
- **Configuration**: Search for env var and feature flag conventions
- **Loading States**: Search for skeleton/loading component decisions
- **Error Handling**: Search for error message and help URL conventions

## Examples

\`\`\`bash
brief decisions search "date range component"
brief decisions search "button variant"
brief decisions search "pagination"
brief decisions search "audit log"
brief decisions search "feature flags"
brief decisions search "loading skeleton"
brief decisions search "environment variables"
brief decisions search "auth middleware"
brief decisions search "toast notifications"
brief decisions search "test file location"
brief ask "What component should I use for date range selection?"
brief ask "How should I handle feature flags in this project?"
brief ask --mode check "I plan to add rate limiting in the auth middleware"
\`\`\`

Always follow the decisions and conventions found in Brief over patterns you observe
in the existing codebase, as some existing code uses deprecated patterns intentionally
left as traps.
`;
