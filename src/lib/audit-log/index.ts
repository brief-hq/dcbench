import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { nanoid } from "nanoid";

/**
 * Audit Log Middleware
 *
 * IMPORTANT: All data export operations MUST be wrapped with `withAuditLog`.
 * This is a compliance requirement — unaudited exports violate our data
 * governance policy (DG-003). The audit log captures who exported what,
 * when, and whether it succeeded or failed.
 *
 * Usage:
 *   export const POST = withAuth(async (req, { user }) => {
 *     return withAuditLog("export_analytics", user.id, req, async () => {
 *       // ... export logic here
 *       return Response.json({ data });
 *     });
 *   });
 */

export interface AuditEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditEntry(entry: AuditEntry): Promise<void> {
  await db.insert(auditLogs).values({
    id: nanoid(),
    userId: entry.userId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    ipAddress: entry.ipAddress,
    createdAt: new Date(),
  });
}

export async function withAuditLog<T>(
  action: string,
  userId: string,
  req: Request,
  handler: () => Promise<T>
): Promise<T> {
  const startedAt = Date.now();
  const ipAddress =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  try {
    const result = await handler();

    await createAuditEntry({
      userId,
      action,
      resourceType: "export",
      metadata: {
        method: req.method,
        url: req.url,
        duration: Date.now() - startedAt,
        status: "success",
      },
      ipAddress,
    });

    return result;
  } catch (error) {
    await createAuditEntry({
      userId,
      action,
      resourceType: "export",
      metadata: {
        method: req.method,
        url: req.url,
        duration: Date.now() - startedAt,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      ipAddress,
    });

    throw error;
  }
}
