/**
 * Benchmark Seed Data
 *
 * Static definitions for the 15 decisions, 3 personas, 5 customer signals,
 * and 3 competitors that map 1:1 to the gotchas in the Prism Analytics codebase.
 *
 * These use HTTP API request body shapes (snake_case), NOT direct DB types.
 */

// ---------------------------------------------------------------------------
// Types (matching Brief HTTP API request bodies)
// ---------------------------------------------------------------------------

export interface DecisionPayload {
  decision: string;
  rationale: string;
  topic: string;
  category: 'tech' | 'product' | 'design' | 'process' | 'general';
  severity: 'info' | 'important' | 'blocking';
  tags: string[];
  origin: string;
  confirmation_status: 'confirmed';
  lifecycle_state: 'active';
}

export interface PersonaPayload {
  persona: {
    segment_name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    needs: string[];
    pain_points: string[];
  };
}

export interface SignalPayload {
  theme: string;
  source: string;
  confidence: number;
  signal_type: 'request' | 'pain_point' | 'validation' | 'churn_risk';
  metadata: Record<string, unknown>;
}

export interface CompetitorPayload {
  domain: string;
}

// ---------------------------------------------------------------------------
// Decisions (15) — one per Prism Analytics gotcha
// ---------------------------------------------------------------------------

export const BENCHMARK_DECISIONS: DecisionPayload[] = [
  {
    topic: 'Date range component standardization',
    decision: 'DateRangePicker is the standard date range component. CalendarRange is deprecated after the mobile redesign and must not be used in new code.',
    rationale: 'CalendarRange had accessibility issues on mobile and was replaced during the mobile redesign. All new date-range UIs must use DateRangePicker from the design system.',
    category: 'design',
    severity: 'important',
    tags: ['design-system', 'components', 'deprecation', 'mobile'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
  {
    topic: 'Audit logging on data exports',
    decision: 'All data exports must go through the audit log middleware. Every export endpoint must call withAuditLog() before streaming data.',
    rationale: 'SOC-2 compliance requires a full audit trail of every data export. The audit log middleware captures who exported what, when, and the row count. Skipping it is a compliance violation.',
    category: 'tech',
    severity: 'blocking',
    tags: ['compliance', 'audit', 'exports', 'soc2'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
  {
    topic: 'Button variant usage policy',
    decision: 'Primary buttons are reserved for data-mutating actions only. Read-only actions like exports, downloads, and navigation use the secondary button variant.',
    rationale: 'User testing showed decision fatigue when multiple primary buttons competed for attention. Reserving primary for mutations (save, delete, submit) creates a clear visual hierarchy.',
    category: 'design',
    severity: 'info',
    tags: ['design-system', 'buttons', 'ux', 'accessibility'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
  {
    topic: 'Pagination strategy for list endpoints',
    decision: 'All list endpoints must use cursor-based pagination. Offset pagination is not allowed for new endpoints.',
    rationale: 'Offset pagination breaks when data is inserted or deleted during paging, causing duplicates or skipped records. Cursor pagination is stable and performs better on large datasets.',
    category: 'tech',
    severity: 'important',
    tags: ['api', 'pagination', 'performance', 'data-integrity'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
  {
    topic: 'Loading state pattern standardization',
    decision: 'Use the ShimmerSkeleton loading pattern from the design system. PulseLoader is deprecated and must not be used in new code.',
    rationale: 'Design system standardization effort unified all loading states to shimmer skeletons. They provide better perceived performance by showing content shape while loading.',
    category: 'design',
    severity: 'info',
    tags: ['design-system', 'loading', 'ux', 'deprecation'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
  {
    topic: 'Auth middleware freeze',
    decision: 'The authentication middleware is frozen and must not be modified. Any auth changes require a compliance review first.',
    rationale: 'The auth middleware passed a compliance audit (SEC-2024-0915-AUTH). Any modification requires re-certification. Changes must go through the security team and compliance review process.',
    category: 'tech',
    severity: 'blocking',
    tags: ['auth', 'compliance', 'security', 'frozen'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
  {
    topic: 'Error message help center references',
    decision: 'All user-facing error messages must include a link to the relevant help center article. Use the helpCenterUrl() utility to generate links.',
    rationale: 'Support ticket analysis showed 40% of tickets were about errors with clear help center documentation. Adding links directly in error messages reduced repeat tickets significantly.',
    category: 'product',
    severity: 'info',
    tags: ['ux', 'support', 'error-handling', 'help-center'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
  {
    topic: 'Feature flag implementation',
    decision: 'Feature flags must use posthog.isFeatureEnabled() from the PostHog SDK. Custom feature flag implementations are not allowed.',
    rationale: 'PostHog provides centralized flag management, gradual rollouts, and analytics integration. Custom implementations fragment flag state and lack audit trails.',
    category: 'tech',
    severity: 'important',
    tags: ['feature-flags', 'posthog', 'tooling', 'observability'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
  {
    topic: 'Test file co-location',
    decision: 'Test files must be co-located next to their source files (e.g., utils.test.ts next to utils.ts). Do not use a separate __tests__/ directory.',
    rationale: 'Co-location makes it obvious when a file lacks tests and simplifies imports. The __tests__/ convention caused files to drift out of sync with their sources.',
    category: 'process',
    severity: 'info',
    tags: ['testing', 'conventions', 'developer-experience'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
  {
    topic: 'API route validation pattern',
    decision: 'All API routes must use Zod schemas for request validation wrapped in the withAuth middleware. This is the standard pattern for all new API endpoints.',
    rationale: 'Zod provides runtime type safety with TypeScript inference. The withAuth wrapper handles authentication, rate limiting, and error formatting consistently.',
    category: 'tech',
    severity: 'important',
    tags: ['api', 'validation', 'zod', 'auth', 'patterns'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
  {
    topic: 'Notification delivery strategy',
    decision: 'The notification system uses async digest delivery. Real-time push notifications are a deliberate non-goal for the current product phase.',
    rationale: 'User research showed notification fatigue with real-time alerts. Async digests let users batch-process notifications at their own pace, improving engagement metrics. Real-time was evaluated and rejected per ADR-007.',
    category: 'product',
    severity: 'important',
    tags: ['notifications', 'product-strategy', 'ux'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
  {
    topic: 'Keyboard navigation for list views',
    decision: 'All list views must support full keyboard navigation including arrow keys, Enter to select, and Escape to deselect. This is an accessibility requirement.',
    rationale: 'WCAG 2.1 AA compliance requires keyboard operability for all interactive elements. List views are a core interaction pattern and must be navigable without a mouse.',
    category: 'design',
    severity: 'important',
    tags: ['accessibility', 'wcag', 'keyboard', 'ux'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
  {
    topic: 'Database query approach',
    decision: 'All database queries must use the Drizzle query builder. Raw SQL queries are not allowed in application code.',
    rationale: 'Drizzle provides type-safe queries, automatic migration generation, and protection against SQL injection. Raw SQL bypasses these safeguards and makes refactoring harder.',
    category: 'tech',
    severity: 'important',
    tags: ['database', 'drizzle', 'security', 'patterns'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
  {
    topic: 'Environment variable management',
    decision: 'Environment configuration must use @t3-oss/env-nextjs for validation. Direct process.env access is not allowed — all env vars must be declared in the env schema.',
    rationale: 'T3 env provides build-time validation of required environment variables and TypeScript types. Direct process.env access is untyped and fails silently when vars are missing.',
    category: 'tech',
    severity: 'info',
    tags: ['configuration', 'environment', 'type-safety', 'validation'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
  {
    topic: 'Toast notification library',
    decision: 'Toast notifications must use the sonner library. Do not use react-hot-toast, custom toast implementations, or window.alert.',
    rationale: 'Sonner integrates with our design system tokens, supports accessible announcements, and provides consistent animations. Multiple toast libraries create inconsistent UX.',
    category: 'design',
    severity: 'info',
    tags: ['design-system', 'notifications', 'toast', 'ux'],
    origin: 'api',
    confirmation_status: 'confirmed',
    lifecycle_state: 'active',
  },
];

// ---------------------------------------------------------------------------
// Personas (3)
// ---------------------------------------------------------------------------

export const BENCHMARK_PERSONAS: PersonaPayload[] = [
  {
    persona: {
      segment_name: 'Platform Admin',
      description: 'Power users who manage the platform, configure settings, and perform bulk operations. They need instant feedback, full data access, and audit capabilities.',
      priority: 'high',
      needs: [
        'Instant feedback on bulk operations',
        'Full data export with audit trails',
        'Role-based access control management',
        'System-wide configuration tools',
      ],
      pain_points: [
        'Slow export processes without progress indicators',
        'Lack of audit trail on data exports',
        'No bulk action support for user management',
      ],
    },
  },
  {
    persona: {
      segment_name: 'End User',
      description: 'Primary product users who interact with the platform daily. Mobile-first, prefer minimal cognitive load, and benefit from progressive disclosure of features.',
      priority: 'medium',
      needs: [
        'Intuitive mobile-first interface',
        'Keyboard shortcuts for common actions',
        'Fast page load and responsive interactions',
        'Clear error messages with actionable guidance',
      ],
      pain_points: [
        'Confusing loading states that look broken',
        'Error messages without guidance on next steps',
        'Desktop-only features that break on mobile',
      ],
    },
  },
  {
    persona: {
      segment_name: 'API Consumer',
      description: 'Developers and partners who integrate via the API. They need versioned endpoints, consistent error formats, and stable pagination across all list endpoints.',
      priority: 'medium',
      needs: [
        'Versioned and backwards-compatible API endpoints',
        'Consistent error response format with codes',
        'Cursor-based pagination on all list endpoints',
        'Type-safe SDK with generated types',
      ],
      pain_points: [
        'Inconsistent pagination methods across endpoints',
        'Breaking API changes without versioning',
        'Undocumented error codes and response formats',
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Customer Signals (5)
// ---------------------------------------------------------------------------

export const BENCHMARK_SIGNALS: SignalPayload[] = [
  {
    theme: 'Date-range scoped CSV export for analytics dashboard',
    source: 'manual',
    confidence: 0.9,
    signal_type: 'request',
    metadata: {
      customer: 'Acme Corp',
      contact: 'Sarah',
      context: 'Wants to export analytics data for a specific date range as CSV, not a full bulk dump of all historical data.',
      persona: 'End User',
    },
  },
  {
    theme: 'Enterprise SSO requirement blocked by auth middleware freeze',
    source: 'manual',
    confidence: 0.85,
    signal_type: 'request',
    metadata: {
      segment: 'Enterprise',
      blocker: 'Auth middleware is frozen for compliance — SSO requires auth changes',
      deal_count: 3,
      persona: 'Platform Admin',
    },
  },
  {
    theme: 'Mobile loading states feel broken — users think app crashed',
    source: 'manual',
    confidence: 0.75,
    signal_type: 'pain_point',
    metadata: {
      feedback_count: 12,
      platforms: ['iOS', 'Android'],
      context: 'PulseLoader on mobile looks like a frozen screen. Users request shimmer skeleton pattern.',
      persona: 'End User',
    },
  },
  {
    theme: 'API pagination inconsistency — some endpoints use offset, others cursor',
    source: 'manual',
    confidence: 0.8,
    signal_type: 'request',
    metadata: {
      partner_count: 5,
      context: 'API consumers confused by mixed pagination styles. Requesting cursor pagination on all list endpoints.',
      persona: 'API Consumer',
    },
  },
  {
    theme: 'Bulk data export needs audit trail for compliance reporting',
    source: 'manual',
    confidence: 0.85,
    signal_type: 'request',
    metadata: {
      interview_count: 4,
      context: 'Admin users need to prove every export was authorized. Current exports lack audit records.',
      persona: 'Platform Admin',
    },
  },
];

// ---------------------------------------------------------------------------
// Competitors (3)
// ---------------------------------------------------------------------------

export const BENCHMARK_COMPETITORS: CompetitorPayload[] = [
  { domain: 'competitorx.io' },
  { domain: 'competitory.com' },
  { domain: 'competitorz.ai' },
];
