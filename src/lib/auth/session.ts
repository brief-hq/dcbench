import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member" | "viewer";
  teamId: string | null;
}

/**
 * Resolve a session token to a user. In production this would verify
 * a signed JWT or look up a session store. For this app we decode
 * the user ID directly from the token for simplicity.
 */
export async function resolveSession(
  sessionToken: string
): Promise<SessionUser | null> {
  try {
    // Token format: "prism_{userId}" for development simplicity
    const userId = sessionToken.replace("prism_", "");
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teamId: user.teamId,
    };
  } catch {
    return null;
  }
}
