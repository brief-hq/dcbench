import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth, requireRole } from "@/lib/auth/with-auth";
import { updateUserSchema } from "@/lib/validators/user";
import { errorResponse } from "@/lib/errors";
import { jsonResponse, noContentResponse } from "@/lib/api/response";

export const GET = withAuth(async (req, { user }) => {
  const id = req.nextUrl.pathname.split("/").pop()!;

  const found = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!found) {
    return errorResponse("USR_001", 404);
  }

  return jsonResponse({
    id: found.id,
    email: found.email,
    name: found.name,
    role: found.role,
    avatarUrl: found.avatarUrl,
    createdAt: found.createdAt,
    updatedAt: found.updatedAt,
  });
});

export const PATCH = withAuth(async (req, { user }) => {
  const id = req.nextUrl.pathname.split("/").pop()!;

  // Only admins can update other users; users can update themselves
  if (id !== user.id) {
    const roleCheck = requireRole(user, "admin");
    if (roleCheck) return roleCheck;
  }

  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("VAL_001", 400, parsed.error.issues[0].message);
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!existing) {
    return errorResponse("USR_001", 404);
  }

  await db
    .update(users)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(users.id, id));

  return jsonResponse({ id, ...parsed.data });
});

export const DELETE = withAuth(async (req, { user }) => {
  const roleCheck = requireRole(user, "admin");
  if (roleCheck) return roleCheck;

  const id = req.nextUrl.pathname.split("/").pop()!;

  const existing = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!existing) {
    return errorResponse("USR_001", 404);
  }

  if (existing.role === "admin") {
    // Prevent deleting the last admin
    const adminCount = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));

    if (adminCount.length <= 1) {
      return errorResponse("USR_003", 400);
    }
  }

  await db.delete(users).where(eq(users.id, id));
  return noContentResponse();
});
