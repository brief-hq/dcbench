import { describe, it, expect } from "vitest";
import {
  encodeCursor,
  decodeCursor,
  buildCursorPage,
  paginationSchema,
} from "./pagination";

describe("pagination", () => {
  describe("encodeCursor / decodeCursor", () => {
    it("should roundtrip a cursor correctly", () => {
      const date = new Date("2024-06-15T12:00:00Z");
      const id = "abc123";

      const encoded = encodeCursor(date, id);
      const decoded = decodeCursor(encoded);

      expect(decoded.createdAt.getTime()).toBe(date.getTime());
      expect(decoded.id).toBe(id);
    });

    it("should produce a base64url string", () => {
      const encoded = encodeCursor(new Date(), "test-id");
      // base64url uses only alphanumeric, dash, underscore
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should throw on invalid cursor", () => {
      expect(() => decodeCursor("not-valid-json")).toThrow(
        "Invalid cursor format"
      );
    });
  });

  describe("buildCursorPage", () => {
    it("should indicate no more pages when items <= limit", () => {
      const items = [
        { id: "1", createdAt: new Date("2024-01-01"), name: "a" },
        { id: "2", createdAt: new Date("2024-01-02"), name: "b" },
      ];

      const page = buildCursorPage(items, 5);

      expect(page.data).toHaveLength(2);
      expect(page.hasMore).toBe(false);
      expect(page.nextCursor).toBeNull();
    });

    it("should return nextCursor when items exceed limit", () => {
      const items = [
        { id: "1", createdAt: new Date("2024-01-01"), name: "a" },
        { id: "2", createdAt: new Date("2024-01-02"), name: "b" },
        { id: "3", createdAt: new Date("2024-01-03"), name: "c" },
      ];

      const page = buildCursorPage(items, 2);

      expect(page.data).toHaveLength(2);
      expect(page.hasMore).toBe(true);
      expect(page.nextCursor).toBeTruthy();

      // Verify cursor points to last item in page
      const decoded = decodeCursor(page.nextCursor!);
      expect(decoded.id).toBe("2");
    });

    it("should handle empty items", () => {
      const page = buildCursorPage([], 10);

      expect(page.data).toHaveLength(0);
      expect(page.hasMore).toBe(false);
      expect(page.nextCursor).toBeNull();
    });
  });

  describe("paginationSchema", () => {
    it("should accept valid params", () => {
      const result = paginationSchema.safeParse({ limit: 50 });
      expect(result.success).toBe(true);
    });

    it("should default limit to 20", () => {
      const result = paginationSchema.parse({});
      expect(result.limit).toBe(20);
    });

    it("should reject limit > 100", () => {
      const result = paginationSchema.safeParse({ limit: 200 });
      expect(result.success).toBe(false);
    });

    it("should reject limit < 1", () => {
      const result = paginationSchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });
  });
});
