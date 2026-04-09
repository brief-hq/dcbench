import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users, teams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { registerSchema } from "@/lib/validators/user";
import { errorResponse } from "@/lib/errors";
import { createdResponse } from "@/lib/api/response";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("VAL_001", 400, parsed.error.issues[0].message);
  }

  const { email, name, password, teamName } = parsed.data;

  // Check for existing user
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    return errorResponse("USR_002", 409);
  }

  // Create team
  const teamId = nanoid();
  await db.insert(teams).values({
    id: teamId,
    name: teamName,
    slug: slugify(teamName),
    plan: "free",
    createdAt: new Date(),
  });

  // Create user (in production, hash the password)
  const userId = nanoid();
  await db.insert(users).values({
    id: userId,
    email,
    name,
    role: "admin",
    teamId,
    passwordHash: `hashed_${password}`, // placeholder
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const sessionToken = `prism_${userId}`;

  const response = createdResponse({
    user: { id: userId, email, name, role: "admin" },
    team: { id: teamId, name: teamName },
  });

  response.headers.set(
    "Set-Cookie",
    `prism_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
  );

  return response;
}
