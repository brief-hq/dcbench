import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { analyticsEvents } from "@/lib/db/schema";
import { eq, and, gte, lte, lt, desc } from "drizzle-orm";
import { withAuth } from "@/lib/auth/with-auth";
import { analyticsQuerySchema } from "@/lib/validators/analytics";
import { paginationSchema, decodeCursor, buildCursorPage } from "@/lib/api/pagination";
import { errorResponse } from "@/lib/errors";
import { jsonResponse } from "@/lib/api/response";

/**
 * GET /api/analytics — query analytics events with cursor pagination.
 *
 * Supports filtering by eventType, startDate, endDate.
 * Uses cursor-based pagination per convention.
 */
export const GET = withAuth(async (req, { user }) => {
  const url = new URL(req.url);

  const filters = analyticsQuerySchema.safeParse({
    eventType: url.searchParams.get("eventType") || undefined,
    startDate: url.searchParams.get("startDate") || undefined,
    endDate: url.searchParams.get("endDate") || undefined,
  });

  const pagination = paginationSchema.safeParse({
    cursor: url.searchParams.get("cursor") || undefined,
    limit: url.searchParams.get("limit") || 20,
  });

  if (!filters.success || !pagination.success) {
    return errorResponse("VAL_001", 400);
  }

  const { eventType, startDate, endDate } = filters.data;
  const { cursor, limit } = pagination.data;

  const conditions = [];

  if (user.teamId) {
    conditions.push(eq(analyticsEvents.teamId, user.teamId));
  }
  if (eventType) {
    conditions.push(eq(analyticsEvents.eventType, eventType));
  }
  if (startDate) {
    conditions.push(gte(analyticsEvents.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(analyticsEvents.createdAt, endDate));
  }
  if (cursor) {
    try {
      const decoded = decodeCursor(cursor);
      conditions.push(lt(analyticsEvents.createdAt, decoded.createdAt));
    } catch {
      return errorResponse("VAL_002", 400);
    }
  }

  const results = await db
    .select()
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(limit + 1);

  const page = buildCursorPage(
    results.map((e) => ({
      id: e.id,
      teamId: e.teamId,
      userId: e.userId,
      eventType: e.eventType,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
      value: e.value,
      createdAt: e.createdAt,
    })),
    limit
  );

  return jsonResponse(page);
});
