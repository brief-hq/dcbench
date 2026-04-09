/**
 * Shared API types used across the application.
 */

export interface ApiError {
  error: string;
  code: string;
  help: string;
  details?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Notification delivery mode.
 *
 * Only async digest delivery is supported (daily or weekly batches).
 * Real-time delivery (WebSocket/SSE) is intentionally not implemented.
 * See ADR-007 for rationale.
 */
export type NotificationDelivery = "daily" | "weekly";

export type UserRole = "admin" | "member" | "viewer";

export type TeamPlan = "free" | "pro" | "enterprise";
