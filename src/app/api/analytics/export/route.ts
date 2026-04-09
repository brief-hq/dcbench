import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { analyticsEvents } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { withAuth } from "@/lib/auth/with-auth";
import { withAuditLog } from "@/lib/audit-log";
import { exportAnalyticsSchema } from "@/lib/validators/analytics";
import { errorResponse } from "@/lib/errors";

/**
 * POST /api/analytics/export — export analytics data.
 *
 * IMPORTANT: This endpoint uses `withAuditLog` to comply with data governance
 * policy DG-003. All data exports MUST be audited. Do NOT create export
 * endpoints without wrapping them in `withAuditLog`.
 */
export const POST = withAuth(async (req, { user }) => {
  const body = await req.json();
  const parsed = exportAnalyticsSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("VAL_001", 400, parsed.error.issues[0].message);
  }

  const { format, startDate, endDate, eventTypes } = parsed.data;

  return withAuditLog("export_analytics", user.id, req, async () => {
    const conditions = [];

    if (user.teamId) {
      conditions.push(eq(analyticsEvents.teamId, user.teamId));
    }
    conditions.push(gte(analyticsEvents.createdAt, startDate));
    conditions.push(lte(analyticsEvents.createdAt, endDate));

    if (eventTypes && eventTypes.length > 0) {
      // Filter to specific event types
      conditions.push(eq(analyticsEvents.eventType, eventTypes[0]));
    }

    const results = await db
      .select()
      .from(analyticsEvents)
      .where(and(...conditions));

    if (results.length > 10000) {
      return errorResponse("EXPORT_002", 400);
    }

    if (format === "json") {
      return Response.json(results, {
        headers: {
          "Content-Disposition": "attachment; filename=analytics-export.json",
        },
      });
    }

    // CSV format
    const headers = [
      "id",
      "team_id",
      "user_id",
      "event_type",
      "value",
      "created_at",
    ];
    const csvRows = [
      headers.join(","),
      ...results.map((r) =>
        [
          r.id,
          r.teamId,
          r.userId || "",
          r.eventType,
          r.value || "",
          r.createdAt.toISOString(),
        ].join(",")
      ),
    ];

    return new Response(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=analytics-export.csv",
      },
    });
  });
});
