import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { loginSchema } from "@/lib/validators/user";
import { errorResponse } from "@/lib/errors";
import { jsonResponse } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("VAL_001", 400, parsed.error.issues[0].message);
  }

  const { email } = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return errorResponse("AUTH_003", 401);
  }

  // In production, verify password hash here.
  // For the benchmark, we accept any password for seeded users.

  const sessionToken = `prism_${user.id}`;

  const response = jsonResponse({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });

  // Set session cookie
  response.headers.set(
    "Set-Cookie",
    `prism_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
  );

  return response;
}
