import { NextRequest } from "next/server";
import { resolveSession, type SessionUser } from "./session";
import { errorResponse } from "@/lib/errors";

interface AuthContext {
  user: SessionUser;
}

type AuthHandler = (
  req: NextRequest,
  ctx: AuthContext
) => Promise<Response>;

/**
 * Wrapper for API route handlers that require authentication.
 *
 * CONVENTION: All non-public API routes MUST use this wrapper.
 * It extracts the session from the request, resolves the user,
 * and passes it to the handler. Returns 401 if unauthenticated.
 *
 * Usage:
 *   export const GET = withAuth(async (req, { user }) => {
 *     // user is guaranteed to be authenticated here
 *     return Response.json({ user });
 *   });
 */
export function withAuth(handler: AuthHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const sessionToken =
      req.cookies.get("prism_session")?.value ||
      req.headers.get("x-user-session");

    if (!sessionToken) {
      return errorResponse("AUTH_001", 401);
    }

    const user = await resolveSession(sessionToken);

    if (!user) {
      return errorResponse("AUTH_001", 401);
    }

    return handler(req, { user });
  };
}

/**
 * Requires the authenticated user to have a specific role.
 * Use after withAuth to add role-based access control.
 */
export function requireRole(
  user: SessionUser,
  ...roles: SessionUser["role"][]
): Response | null {
  if (!roles.includes(user.role)) {
    return errorResponse("AUTH_002", 403);
  }
  return null;
}
