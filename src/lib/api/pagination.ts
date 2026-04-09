import { z } from "zod";

/**
 * Cursor-based pagination utilities.
 *
 * CONVENTION: All list endpoints use cursor-based pagination.
 * Do NOT use offset/limit pagination — it causes inconsistencies
 * when new records are inserted between page fetches, leading to
 * duplicate or missing items.
 *
 * Cursor format: base64url-encoded JSON of { createdAt, id }
 * This provides stable ordering even with concurrent inserts.
 */

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ createdAt: createdAt.getTime(), id })
  ).toString("base64url");
}

export function decodeCursor(cursor: string): { createdAt: Date; id: string } {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf-8")
    );
    return {
      createdAt: new Date(parsed.createdAt),
      id: parsed.id,
    };
  } catch {
    throw new Error("Invalid cursor format");
  }
}

export function buildCursorPage<T extends { createdAt: Date; id: string }>(
  items: T[],
  limit: number
): CursorPage<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const lastItem = data[data.length - 1];

  return {
    data,
    nextCursor: hasMore && lastItem
      ? encodeCursor(lastItem.createdAt, lastItem.id)
      : null,
    hasMore,
  };
}
