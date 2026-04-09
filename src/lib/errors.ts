/**
 * Error codes and help center URL mapping.
 *
 * CONVENTION: All user-facing error responses MUST include a `help` URL
 * pointing to the relevant help center article. Format:
 *   https://help.example.com/errors/{ERROR_CODE}
 *
 * Do NOT return plain error messages without the help URL.
 */

export const ERROR_CODES = {
  AUTH_001: "Unauthorized — session expired or missing",
  AUTH_002: "Forbidden — insufficient permissions",
  AUTH_003: "Invalid credentials",
  VAL_001: "Validation error — check request body",
  VAL_002: "Invalid cursor format",
  USR_001: "User not found",
  USR_002: "Email already registered",
  USR_003: "Cannot delete the last admin",
  TEAM_001: "Team not found",
  TEAM_002: "Team member limit reached on current plan",
  EXPORT_001: "Export failed — try again later",
  EXPORT_002: "Export too large — narrow your date range",
  RATE_001: "Rate limit exceeded — try again in a few minutes",
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

const HELP_CENTER_BASE = "https://help.example.com/errors";

export function createErrorResponse(code: ErrorCode, details?: string) {
  return {
    error: ERROR_CODES[code],
    code,
    help: `${HELP_CENTER_BASE}/${code}`,
    ...(details ? { details } : {}),
  };
}

export function errorResponse(code: ErrorCode, status: number, details?: string) {
  return Response.json(createErrorResponse(code, details), { status });
}
