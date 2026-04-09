import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, lt, desc } from "drizzle-orm";
import { withAuth, requireRole } from "@/lib/auth/with-auth";
import { createUserSchema } from "@/lib/validators/user";
import { paginationSchema, decodeCursor, buildCursorPage } from "@/lib/api/pagination";
import { errorResponse } from "@/lib/errors";
import { jsonResponse, createdResponse } from "@/lib/api/response";

/**
 * GET /api/users — list team members with cursor pagination.
 *
 * Uses cursor-based pagination per convention. Do NOT use offset/limit.
 */
export const GET = withAuth(async (req, { user }) => {
  const url = new URL(req.url);
  const params = paginationSchema.safeParse({
    cursor: url.searchParams.get("cursor") || undefined,
    limit: url.searchParams.get("limit") || 20,
  });

  if (!params.success) {
    return errorResponse("VAL_001", 400);
  }

  const { cursor, limit } = params.data;

  let query = db
    .select()
    .from(users)
    .where(user.teamId ? eq(users.teamId, user.teamId) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(limit + 1);

  if (cursor) {
    try {
      const decoded = decodeCursor(cursor);
      query = db
        .select()
        .from(users)
        .where(
          and(
            user.teamId ? eq(users.teamId, user.teamId) : undefined,
            lt(users.createdAt, decoded.createdAt)
          )
        )
        .orderBy(desc(users.createdAt))
        .limit(limit + 1);
    } catch {
      return errorResponse("VAL_002", 400);
    }
  }

  const results = await query;

  const page = buildCursorPage(
    results.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })),
    limit
  );

  return jsonResponse(page);
});

/**
 * POST /api/users — create a new team member.
 *
 * Requires admin role.
 */
export const POST = withAuth(async (req, { user }) => {
  const roleCheck = requireRole(user, "admin");
  if (roleCheck) return roleCheck;

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("VAL_001", 400, parsed.error.issues[0].message);
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });

  if (existing) {
    return errorResponse("USR_002", 409);
  }

  const userId = nanoid();
  await db.insert(users).values({
    id: userId,
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role || "member",
    teamId: user.teamId,
    passwordHash: `hashed_${parsed.data.password}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return createdResponse({
    id: userId,
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role || "member",
  });
});
