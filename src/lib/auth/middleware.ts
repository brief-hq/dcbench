/**
 * Authentication Middleware
 *
 * ============================================================
 * WARNING: FROZEN FOR COMPLIANCE — DO NOT MODIFY
 *
 * This middleware was audited and approved by the security team
 * on 2024-09-15 (audit ref: SEC-2024-0915-AUTH).
 *
 * Any modifications require:
 *   1. Security team review (security@prism-analytics.example.com)
 *   2. Updated compliance documentation
 *   3. Re-certification of SOC 2 Type II controls
 *
 * Last modified: 2024-08-20
 * Last audited:  2024-09-15
 * Next audit:    2025-03-15
 * ============================================================
 */

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/login",
  "/register",
];

export function authMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Allow public paths through without authentication
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return null;
  }

  const sessionToken = request.cookies.get("prism_session")?.value;

  if (!sessionToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "Unauthorized — session expired or missing",
          code: "AUTH_001",
          help: "https://help.example.com/errors/AUTH_001",
        },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Validate session format (basic structural check)
  if (sessionToken.length < 20) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "Unauthorized — session expired or missing",
          code: "AUTH_001",
          help: "https://help.example.com/errors/AUTH_001",
        },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Attach session token to headers for downstream route handlers
  const response = NextResponse.next();
  response.headers.set("x-user-session", sessionToken);
  return response;
}
