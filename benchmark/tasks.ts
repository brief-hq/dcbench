/**
 * Benchmark Task Set — 15 Scored Tasks with Gotcha Rubrics
 *
 * Each task is a realistic coding request a founder would give a coding agent.
 * Every task has 2-4 "gotchas" — product decisions that a raw coding agent
 * will miss but a Brief-assisted agent should catch via `brief ask` and
 * `brief decisions search`.
 *
 * Consumed by benchmark harness for automated scoring.
 * Target repo: brief-hq/brief-benchmark-repo (Prism Analytics)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * How a gotcha check is evaluated against the agent's output.
 *
 * - grep_diff:         Regex against `git diff` output (added lines only).
 * - grep_tree:         Regex against final file content after agent changes.
 * - file_exists:       Assert a file exists at a glob path.
 * - file_not_exists:   Assert a file does NOT exist at a glob path.
 * - file_not_modified: Assert a file was NOT touched in the diff.
 */
export type GotchaCheckType =
  | "grep_diff"
  | "grep_tree"
  | "file_exists"
  | "file_not_exists"
  | "file_not_modified";

export interface GotchaCheck {
  check: GotchaCheckType;
  /** Regex for grep checks, glob for file checks. */
  pattern: string;
  /** Optional file glob to scope grep searches. */
  target?: string;
}

/**
 * A single gotcha criterion within a task rubric.
 *
 * Each gotcha represents one product decision the agent should respect.
 * `pass` detects correct behavior. `fail` detects the anti-pattern trap.
 * At least one of pass/fail must be defined.
 */
export interface Gotcha {
  /** Stable identifier, e.g., "D-002-audit-log" */
  id: string;
  /** Which seeded decision this tests, e.g., "D-002" */
  decisionId: string;
  /** Human-readable description of what this gotcha checks */
  description: string;
  /** If this matches, the agent got it right. */
  pass?: GotchaCheck;
  /** If this matches, the agent fell for the trap. */
  fail?: GotchaCheck;
  /**
   * 1 = style convention (toast library, test co-location)
   * 2 = important pattern (correct component, pagination style)
   * 3 = compliance/security (audit log, frozen auth, env config)
   */
  weight: 1 | 2 | 3;
}

export type TaskDifficulty = "easy" | "medium" | "hard";

export type TaskCategory =
  | "ui-component"
  | "api-endpoint"
  | "full-stack"
  | "configuration"
  | "security";

/**
 * A single benchmark task with natural-language prompt and scoring rubric.
 */
export interface BenchmarkTask {
  /** Stable identifier, e.g., "TASK-001" */
  taskId: string;
  /** Short title for dashboards/reports */
  title: string;
  /** Natural-language prompt sent to the agent — no hints about gotchas. */
  prompt: string;
  difficulty: TaskDifficulty;
  category: TaskCategory;
  gotchas: Gotcha[];
  /**
   * Files the agent is expected to create or modify (glob patterns).
   * Used as a gate check — if none match, the task scores 0.
   */
  expectedFiles: string[];
  /** Precomputed sum of gotcha weights for percentage calculation. */
  maxScore: number;
}

// ---------------------------------------------------------------------------
// Task Definitions
// ---------------------------------------------------------------------------

export const BENCHMARK_TASKS: readonly BenchmarkTask[] = [
  // -----------------------------------------------------------------------
  // TASK-001: CSV export to analytics dashboard
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-001",
    title: "CSV export to analytics dashboard",
    prompt: [
      "Add a CSV export button to the analytics dashboard.",
      "Users should be able to pick a date range, preview how many records",
      "they'll get, and download their data as a CSV file.",
      "Put the export button next to the existing filters.",
    ].join(" "),
    difficulty: "hard",
    category: "full-stack",
    gotchas: [
      {
        id: "D-002-audit-log-export",
        decisionId: "D-002",
        description:
          "Data exports must be wrapped with withAuditLog (DG-003 compliance). " +
          "See src/lib/audit-log/index.ts and src/app/api/analytics/export/route.ts for the pattern.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*withAuditLog",
        },
        weight: 3,
      },
      {
        id: "D-001-date-range-picker",
        decisionId: "D-001",
        description:
          "Must use DateRangePicker (from/to props), not deprecated CalendarRange (startDate/endDate). " +
          "CalendarRange is still imported in notification-preferences.tsx — agents will copy that pattern.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*import.*\\bDateRangePicker\\b",
        },
        fail: {
          check: "grep_diff",
          pattern: "^\\+.*import.*\\bCalendarRange\\b",
        },
        weight: 2,
      },
      {
        id: "D-003-button-secondary-export",
        decisionId: "D-003",
        description:
          'Export/download is a read-only action — button variant should be "secondary", not "primary". ' +
          "See src/components/ui/button.tsx lines 8-16 for the variant convention.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*variant[=:]\\s*[\"']secondary[\"']",
          target: "src/components/**/*.tsx",
        },
        weight: 1,
      },
    ],
    expectedFiles: [
      "src/components/dashboard/export-*",
      "src/app/api/analytics/export/**",
    ],
    maxScore: 6,
  },

  // -----------------------------------------------------------------------
  // TASK-002: Loading skeletons to settings page
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-002",
    title: "Loading skeletons to settings page",
    prompt: [
      "The settings page feels janky while loading — users see a blank page",
      "for a second before content appears. Add skeleton loading states so",
      "users see placeholder content while data loads. Look at how other",
      "pages in the app handle loading for reference.",
    ].join(" "),
    difficulty: "easy",
    category: "ui-component",
    gotchas: [
      {
        id: "D-005-shimmer-skeleton",
        decisionId: "D-005",
        description:
          "Must use ShimmerSkeleton (Tailwind-based), not deprecated PulseLoader (inline CSS keyframes). " +
          "PulseLoader is still imported in src/app/dashboard/loading.tsx — agents will copy that pattern.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*import.*\\bShimmerSkeleton\\b",
        },
        fail: {
          check: "grep_diff",
          pattern: "^\\+.*import.*\\bPulseLoader\\b",
        },
        weight: 2,
      },
      {
        id: "D-005-no-pulse-loader-dots",
        decisionId: "D-005",
        description:
          "Must not use PulseLoaderDots variant either — use ShimmerSkeletonGroup instead.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*import.*\\bShimmerSkeletonGroup\\b",
        },
        fail: {
          check: "grep_diff",
          pattern: "^\\+.*import.*\\bPulseLoaderDots\\b",
        },
        weight: 2,
      },
    ],
    expectedFiles: ["src/app/settings/loading.tsx"],
    maxScore: 4,
  },

  // -----------------------------------------------------------------------
  // TASK-003: Cursor pagination to users API
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-003",
    title: "Cursor pagination to users API",
    prompt: [
      "Our users list API endpoint returns all users at once which is getting",
      "slow as we scale. Add pagination to the GET /api/users endpoint so",
      "clients can page through results efficiently. Return a next cursor",
      "that clients pass to get the next page.",
    ].join(" "),
    difficulty: "medium",
    category: "api-endpoint",
    gotchas: [
      {
        id: "D-004-cursor-pagination",
        decisionId: "D-004",
        description:
          "Must use cursor-based pagination (base64url encoded), not offset/limit. " +
          "See src/lib/api/pagination.ts for decodeCursor/buildCursorPage helpers.",
        pass: {
          check: "grep_diff",
          pattern:
            "^\\+.*(cursor|decodeCursor|buildCursorPage|base64url)",
        },
        fail: {
          check: "grep_diff",
          pattern:
            "^\\+.*(offset\\s*[=:]|limit\\s*[=:]|page\\s*[=:]\\s*\\d|skip\\s*[=:])",
          target: "src/app/api/**/*.ts",
        },
        weight: 2,
      },
      {
        id: "D-010-zod-withauth",
        decisionId: "D-010",
        description:
          "API routes must use Zod for input validation and withAuth wrapper. " +
          "See src/lib/auth/with-auth.ts and src/app/api/users/route.ts for the pattern.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*(withAuth|z\\.object|z\\.string|zod)",
          target: "src/app/api/**/*.ts",
        },
        weight: 3,
      },
    ],
    expectedFiles: ["src/app/api/users/route.ts"],
    maxScore: 5,
  },

  // -----------------------------------------------------------------------
  // TASK-004: Notification preferences page
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-004",
    title: "Notification preferences page",
    prompt: [
      "Build a notification preferences page where users can choose what",
      "notifications they want and how they want to receive them. Think email",
      "updates, product announcements, that kind of thing. Let them pick",
      "frequency and notification types.",
    ].join(" "),
    difficulty: "medium",
    category: "full-stack",
    gotchas: [
      {
        id: "D-011-async-digest-only",
        decisionId: "D-011",
        description:
          "Only async digest delivery (daily/weekly). No real-time/instant/WebSocket — " +
          "rejected per ADR-007. See src/components/settings/notification-preferences.tsx lines 12-18.",
        pass: {
          check: "grep_diff",
          pattern:
            "^\\+.*(daily|weekly|digest|frequency.*[\"'](daily|weekly)[\"'])",
        },
        fail: {
          check: "grep_diff",
          pattern:
            "^\\+.*(realtime|real-time|instant|websocket|WebSocket|SSE|push_notification|socket\\.io)",
        },
        weight: 2,
      },
      {
        id: "D-008-posthog-feature-flag",
        decisionId: "D-008",
        description:
          "Feature flags must use PostHog via useFeatureFlag hook, not custom booleans. " +
          "See src/hooks/use-feature-flag.ts.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*import.*\\buseFeatureFlag\\b",
        },
        fail: {
          check: "grep_diff",
          pattern:
            "^\\+.*(ENABLE_|FEATURE_|isEnabled\\s*=\\s*(true|false)|showNotif.*=.*true)",
        },
        weight: 2,
      },
    ],
    expectedFiles: [
      "src/components/settings/notification-preferences*",
      "src/app/settings/**",
    ],
    maxScore: 4,
  },

  // -----------------------------------------------------------------------
  // TASK-005: Fix error messages on login page
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-005",
    title: "Fix error messages on login page",
    prompt: [
      "Our login page error messages are pretty unhelpful — users just see",
      '"Something went wrong" when they enter wrong credentials or their',
      "session expires. Improve the error messages so users actually know",
      "what happened and how to fix it.",
    ].join(" "),
    difficulty: "medium",
    category: "security",
    gotchas: [
      {
        id: "D-007-help-center-url",
        decisionId: "D-007",
        description:
          "All user-facing errors must include a help center URL. " +
          "See src/lib/errors.ts — use createErrorResponse/errorResponse which auto-include help URLs.",
        pass: {
          check: "grep_diff",
          pattern:
            "^\\+.*(help\\.example\\.com\\/errors|createErrorResponse|errorResponse)",
        },
        weight: 1,
      },
      {
        id: "D-006-auth-middleware-frozen",
        decisionId: "D-006",
        description:
          "Auth middleware is frozen for compliance (SEC-2024-0915-AUTH). " +
          "Must NOT be modified — fix errors in the login route handler, not the middleware.",
        pass: {
          check: "file_not_modified",
          pattern: "src/lib/auth/middleware.ts",
        },
        weight: 3,
      },
    ],
    expectedFiles: ["src/app/api/auth/login/route.ts"],
    maxScore: 4,
  },

  // -----------------------------------------------------------------------
  // TASK-006: Dark mode toggle to settings
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-006",
    title: "Dark mode toggle to settings",
    prompt: [
      "Add a dark mode toggle to the settings page. When users flip it, the",
      "app should switch between light and dark themes. Store the preference",
      "so it persists across sessions. Make sure to read the theme preference",
      "on app startup.",
    ].join(" "),
    difficulty: "medium",
    category: "full-stack",
    gotchas: [
      {
        id: "D-009-test-colocation",
        decisionId: "D-009",
        description:
          "Test files must be co-located with source (src/**/*.test.{ts,tsx}), " +
          "not in __tests__/ directories. See vitest.config.ts lines 15-17.",
        fail: {
          check: "file_exists",
          pattern: "**/__tests__/**",
        },
        weight: 1,
      },
      {
        id: "D-014-t3-env-config",
        decisionId: "D-014",
        description:
          "Environment variables must go through @t3-oss/env-nextjs, never process.env directly. " +
          "See src/lib/env.ts — import { env } from '@/lib/env'.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*import.*env.*from.*['\"]@/lib/env['\"]",
        },
        fail: {
          check: "grep_diff",
          pattern: "^\\+.*process\\.env\\.",
        },
        weight: 3,
      },
    ],
    expectedFiles: ["src/components/settings/**", "src/app/settings/**"],
    maxScore: 4,
  },

  // -----------------------------------------------------------------------
  // TASK-007: Keyboard navigation to user list
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-007",
    title: "Keyboard navigation to user list",
    prompt: [
      "Make the users list table fully keyboard navigable. Users should be",
      "able to tab through rows, use arrow keys to move between them, and",
      "press Enter to open a user's profile. Make sure it works with screen",
      "readers too.",
    ].join(" "),
    difficulty: "medium",
    category: "ui-component",
    gotchas: [
      {
        id: "D-012-keyboard-nav-aria",
        decisionId: "D-012",
        description:
          "Must implement proper ARIA attributes and keyboard event handlers for accessibility.",
        pass: {
          check: "grep_diff",
          pattern:
            "^\\+.*(onKeyDown|aria-activedescendant|role=['\"]grid['\"]|role=['\"]row['\"]|tabIndex)",
        },
        weight: 1,
      },
      {
        id: "D-001-date-range-picker-list",
        decisionId: "D-001",
        description:
          "If adding date filtering to the list, must use DateRangePicker not CalendarRange.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*import.*\\bDateRangePicker\\b",
        },
        fail: {
          check: "grep_diff",
          pattern: "^\\+.*import.*\\bCalendarRange\\b",
        },
        weight: 2,
      },
    ],
    expectedFiles: ["src/components/**/*user*", "src/app/**/*user*"],
    maxScore: 3,
  },

  // -----------------------------------------------------------------------
  // TASK-008: Bulk delete for admin dashboard
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-008",
    title: "Bulk delete for admin dashboard",
    prompt: [
      "Add bulk delete functionality to the admin dashboard. Admins need to",
      "select multiple items using checkboxes, then click a button to delete",
      "them all at once. Show a confirmation dialog before actually deleting.",
      "Make sure the action is logged.",
    ].join(" "),
    difficulty: "medium",
    category: "full-stack",
    gotchas: [
      {
        id: "D-003-button-primary-mutation",
        decisionId: "D-003",
        description:
          'Delete IS a mutation — button variant should be "destructive" or "primary", NOT "secondary". ' +
          "See src/components/ui/button.tsx lines 8-16 for variant semantics.",
        pass: {
          check: "grep_diff",
          pattern:
            "^\\+.*(?:delete|Delete).*variant[=:]\\s*[\"'](destructive|primary)[\"']",
          target: "src/components/**/*.tsx",
        },
        fail: {
          check: "grep_diff",
          pattern:
            "^\\+.*(?:delete|Delete).*variant[=:]\\s*[\"']secondary[\"']",
          target: "src/components/**/*.tsx",
        },
        weight: 1,
      },
      {
        id: "D-002-audit-log-delete",
        decisionId: "D-002",
        description:
          "Bulk delete must be wrapped with withAuditLog for DG-003 compliance.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*withAuditLog",
          target: "src/app/api/**/*.ts",
        },
        weight: 3,
      },
    ],
    expectedFiles: ["src/components/dashboard/**", "src/app/api/**"],
    maxScore: 4,
  },

  // -----------------------------------------------------------------------
  // TASK-009: Search to API endpoints
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-009",
    title: "Search to API endpoints",
    prompt: [
      "We need search functionality on our API. Add a search endpoint where",
      "users can search across their data by keyword. Results should be",
      "paginated and the search input should be validated. Use the existing",
      "database setup for queries.",
    ].join(" "),
    difficulty: "hard",
    category: "api-endpoint",
    gotchas: [
      {
        id: "D-010-zod-withauth-search",
        decisionId: "D-010",
        description:
          "Search API route must use Zod for input validation and withAuth wrapper.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*(withAuth|z\\.object|z\\.string)",
          target: "src/app/api/**/*.ts",
        },
        weight: 3,
      },
      {
        id: "D-004-cursor-pagination-search",
        decisionId: "D-004",
        description:
          "Search results must use cursor-based pagination, not offset/limit. " +
          "See src/lib/api/pagination.ts for helpers.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*(cursor|decodeCursor|buildCursorPage)",
          target: "src/app/api/**/*.ts",
        },
        fail: {
          check: "grep_diff",
          pattern:
            "^\\+.*(offset\\s*[=:]|page\\s*[=:]\\s*\\d|skip\\s*[=:])",
          target: "src/app/api/**/*.ts",
        },
        weight: 2,
      },
      {
        id: "D-013-drizzle-query-builder",
        decisionId: "D-013",
        description:
          "Database queries must use Drizzle ORM query builder, not raw SQL or other ORMs. " +
          "See src/lib/db/index.ts and existing API routes for the pattern.",
        pass: {
          check: "grep_diff",
          pattern:
            "^\\+.*(db\\.select|db\\.query|from\\(.*\\)|drizzle-orm)",
          target: "src/app/api/**/*.ts",
        },
        fail: {
          check: "grep_diff",
          pattern:
            "^\\+.*(sql`|\\$queryRaw|knex|prisma\\.|raw\\s*\\(|execute\\s*\\(\\s*['\"]SELECT)",
          target: "src/app/api/**/*.ts",
        },
        weight: 2,
      },
    ],
    expectedFiles: [
      "src/app/api/**/search/**",
      "src/app/api/**/route.ts",
    ],
    maxScore: 7,
  },

  // -----------------------------------------------------------------------
  // TASK-010: Toast notifications for form saves
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-010",
    title: "Toast notifications for form saves",
    prompt: [
      "When users save a form on the settings page, they don't get any visual",
      "feedback that it worked. Add toast notifications for successful saves,",
      "validation errors, and server errors. Keep them brief and non-blocking.",
    ].join(" "),
    difficulty: "easy",
    category: "ui-component",
    gotchas: [
      {
        id: "D-015-sonner-toast",
        decisionId: "D-015",
        description:
          "Must use sonner for toast notifications, not react-hot-toast or custom implementations. " +
          "See src/hooks/use-toast.ts which wraps sonner.",
        pass: {
          check: "grep_diff",
          pattern:
            "^\\+.*import.*(?:toast|sonner).*from.*['\"]sonner['\"]",
        },
        fail: {
          check: "grep_diff",
          pattern:
            "^\\+.*import.*from.*['\"]react-hot-toast['\"]",
        },
        weight: 2,
      },
    ],
    expectedFiles: ["src/components/settings/**", "src/app/settings/**"],
    maxScore: 2,
  },

  // -----------------------------------------------------------------------
  // TASK-011: User profile avatar upload
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-011",
    title: "User profile avatar upload",
    prompt: [
      "Let users upload a profile avatar image. Show a button that opens a",
      "file picker, display a preview of the selected image, then upload it",
      "to our storage. Show the avatar in the header and on their profile page.",
    ].join(" "),
    difficulty: "medium",
    category: "full-stack",
    gotchas: [
      {
        id: "D-003-button-secondary-upload",
        decisionId: "D-003",
        description:
          'Upload trigger opens a picker (read-only action) — button variant should be "secondary".',
        pass: {
          check: "grep_diff",
          pattern:
            "^\\+.*(?:upload|avatar|photo|image).*variant[=:]\\s*[\"']secondary[\"']",
          target: "src/components/**/*.tsx",
        },
        weight: 1,
      },
      {
        id: "D-014-t3-env-storage",
        decisionId: "D-014",
        description:
          "Storage config (S3 bucket, upload URL) must use @t3-oss/env-nextjs, not process.env directly.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*import.*env.*from.*['\"]@/lib/env['\"]",
        },
        fail: {
          check: "grep_diff",
          pattern: "^\\+.*process\\.env\\.",
        },
        weight: 3,
      },
    ],
    expectedFiles: [
      "src/components/**/avatar*",
      "src/app/api/**/avatar*",
      "src/app/api/**/upload*",
    ],
    maxScore: 4,
  },

  // -----------------------------------------------------------------------
  // TASK-012: Rate limiting to API routes
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-012",
    title: "Rate limiting to API routes",
    prompt: [
      "We're getting hammered by bots and need to protect our API. Add rate",
      "limiting to the main API routes so we can limit requests per IP or per",
      "authenticated user. Start with the users and analytics endpoints.",
    ].join(" "),
    difficulty: "hard",
    category: "security",
    gotchas: [
      {
        id: "D-010-withauth-rate-limit",
        decisionId: "D-010",
        description:
          "Rate-limited routes must still use withAuth wrapper for authentication.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*withAuth",
          target: "src/app/api/**/*.ts",
        },
        weight: 3,
      },
      {
        id: "D-006-auth-middleware-frozen-ratelimit",
        decisionId: "D-006",
        description:
          "Auth middleware is frozen (SEC-2024-0915-AUTH). Rate limiting must NOT be added there — " +
          "agents naturally want to put rate limiting in middleware, but that file cannot be touched.",
        pass: {
          check: "file_not_modified",
          pattern: "src/lib/auth/middleware.ts",
        },
        weight: 3,
      },
    ],
    expectedFiles: ["src/lib/**/rate-limit*", "src/app/api/**/*.ts"],
    maxScore: 6,
  },

  // -----------------------------------------------------------------------
  // TASK-013: Export audit log viewer
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-013",
    title: "Export audit log viewer",
    prompt: [
      "Build an audit log viewer page for admins. They should see a table of",
      "who exported what data and when, with the ability to filter by date",
      "range, user, and action type. Include a loading skeleton while the data",
      "loads. Admins should also be able to export the audit log itself.",
    ].join(" "),
    difficulty: "medium",
    category: "full-stack",
    gotchas: [
      {
        id: "D-002-audit-log-meta-export",
        decisionId: "D-002",
        description:
          "Even exporting the audit log itself must be wrapped with withAuditLog (DG-003). " +
          "The irony is intentional — it's a real compliance requirement.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*withAuditLog",
          target: "src/app/api/**/*.ts",
        },
        weight: 3,
      },
      {
        id: "D-005-shimmer-audit-viewer",
        decisionId: "D-005",
        description:
          "Loading state must use ShimmerSkeleton, not deprecated PulseLoader.",
        pass: {
          check: "grep_diff",
          pattern: "^\\+.*import.*\\bShimmerSkeleton\\b",
        },
        fail: {
          check: "grep_diff",
          pattern: "^\\+.*import.*\\bPulseLoader\\b",
        },
        weight: 2,
      },
    ],
    expectedFiles: ["src/components/**/audit*", "src/app/**/audit*"],
    maxScore: 5,
  },

  // -----------------------------------------------------------------------
  // TASK-014: Mobile-responsive dashboard layout
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-014",
    title: "Mobile-responsive dashboard layout",
    prompt: [
      "Our analytics dashboard looks terrible on phones and tablets. Make the",
      "dashboard layout responsive so it works well on mobile devices. The key",
      "metrics cards should stack vertically on small screens and the charts",
      "should be scrollable.",
    ].join(" "),
    difficulty: "easy",
    category: "ui-component",
    gotchas: [
      {
        id: "D-PERSONA-001-mobile-first",
        decisionId: "D-PERSONA-001",
        description:
          "End user persona requires mobile-first CSS — base styles for mobile, " +
          "then sm:/md:/lg: breakpoints for larger screens. Not desktop-first with max-width overrides.",
        pass: {
          check: "grep_diff",
          pattern:
            "^\\+.*class.*[\"'].*(?:flex-col|grid-cols-1|w-full).*(?:sm:|md:|lg:)",
        },
        fail: {
          check: "grep_diff",
          pattern:
            "^\\+.*@media.*min-width.*(?:1024|1280|desktop)",
        },
        weight: 2,
      },
    ],
    expectedFiles: [
      "src/app/dashboard/**",
      "src/components/dashboard/**",
    ],
    maxScore: 2,
  },

  // -----------------------------------------------------------------------
  // TASK-015: Feature flag for new analytics widget
  // -----------------------------------------------------------------------
  {
    taskId: "TASK-015",
    title: "Feature flag for new analytics widget",
    prompt: [
      "We're building a new analytics widget that shows conversion funnel",
      "data. Set up a feature flag so we can roll it out gradually — show it",
      "to internal users first, then beta testers, then everyone. Add the",
      "widget component behind the flag.",
    ].join(" "),
    difficulty: "easy",
    category: "configuration",
    gotchas: [
      {
        id: "D-008-posthog-flag-widget",
        decisionId: "D-008",
        description:
          "Feature flags must use PostHog via useFeatureFlag hook, not custom boolean env vars or constants. " +
          "See src/hooks/use-feature-flag.ts and src/lib/posthog.ts.",
        pass: {
          check: "grep_diff",
          pattern:
            "^\\+.*(?:useFeatureFlag|posthog\\.isFeatureEnabled|usePostHog)",
        },
        fail: {
          check: "grep_diff",
          pattern:
            "^\\+.*(SHOW_WIDGET|ENABLE_FUNNEL|FEATURE_FLAG.*=.*(?:true|false)|process\\.env\\..*(?:FEATURE|FLAG|ENABLE|SHOW))",
        },
        weight: 2,
      },
    ],
    expectedFiles: [
      "src/components/**/*widget*",
      "src/components/**/*funnel*",
    ],
    maxScore: 2,
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a task by its stable ID. */
export function getTaskById(
  taskId: string,
): BenchmarkTask | undefined {
  return BENCHMARK_TASKS.find((t) => t.taskId === taskId);
}

/** Get all tasks in a given category. */
export function getTasksByCategory(
  category: TaskCategory,
): readonly BenchmarkTask[] {
  return BENCHMARK_TASKS.filter((t) => t.category === category);
}

/** Get all tasks at a given difficulty level. */
export function getTasksByDifficulty(
  difficulty: TaskDifficulty,
): readonly BenchmarkTask[] {
  return BENCHMARK_TASKS.filter((t) => t.difficulty === difficulty);
}

/** Total max score across all tasks. */
export const TOTAL_MAX_SCORE = BENCHMARK_TASKS.reduce(
  (sum, t) => sum + t.maxScore,
  0,
);

/** All unique decision IDs referenced by gotchas. */
export const DECISION_IDS = Array.from(
  new Set(
    BENCHMARK_TASKS.flatMap((t) => t.gotchas.map((g) => g.decisionId)),
  ),
).sort();
