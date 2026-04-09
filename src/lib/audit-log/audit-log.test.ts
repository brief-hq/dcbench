import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuditEntry, withAuditLog } from "./index";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test-audit-id"),
}));

describe("audit-log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAuditEntry", () => {
    it("should insert an audit log entry", async () => {
      const { db } = await import("@/lib/db");

      await createAuditEntry({
        userId: "user-1",
        action: "export_data",
        resourceType: "export",
        metadata: { format: "csv" },
      });

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe("withAuditLog", () => {
    it("should execute handler and log success", async () => {
      const { db } = await import("@/lib/db");
      const mockReq = new Request("http://localhost/api/export", {
        method: "POST",
      });

      const result = await withAuditLog(
        "export_analytics",
        "user-1",
        mockReq,
        async () => {
          return { data: "exported" };
        }
      );

      expect(result).toEqual({ data: "exported" });
      expect(db.insert).toHaveBeenCalled();
    });

    it("should log failure and rethrow on handler error", async () => {
      const { db } = await import("@/lib/db");
      const mockReq = new Request("http://localhost/api/export", {
        method: "POST",
      });

      await expect(
        withAuditLog("export_analytics", "user-1", mockReq, async () => {
          throw new Error("Export failed");
        })
      ).rejects.toThrow("Export failed");

      // Should still have logged the failure
      expect(db.insert).toHaveBeenCalled();
    });
  });
});
