import { describe, it, expect } from "vitest";
import {
  validateNotificationSettings,
  notificationSettingsSchema,
  profileSettingsSchema,
} from "@/lib/validators/settings";

/**
 * Settings validation tests — co-located with the settings page.
 *
 * Tests the validation logic used by the settings forms.
 * This file lives next to page.tsx, following the project convention
 * of co-locating tests with their source files.
 */
describe("settings validation", () => {
  describe("notificationSettingsSchema", () => {
    it("should accept valid daily frequency", () => {
      const result = notificationSettingsSchema.safeParse({
        digestFrequency: "daily",
        emailEnabled: true,
        alertTypes: ["digest", "alert"],
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid weekly frequency", () => {
      const result = notificationSettingsSchema.safeParse({
        digestFrequency: "weekly",
        emailEnabled: false,
        alertTypes: ["system"],
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid frequency (no real-time option)", () => {
      const result = notificationSettingsSchema.safeParse({
        digestFrequency: "realtime",
        emailEnabled: true,
        alertTypes: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject instant frequency", () => {
      const result = notificationSettingsSchema.safeParse({
        digestFrequency: "instant",
        emailEnabled: true,
        alertTypes: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid alert types", () => {
      const result = notificationSettingsSchema.safeParse({
        digestFrequency: "daily",
        emailEnabled: true,
        alertTypes: ["push_notification"],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("validateNotificationSettings", () => {
    it("should return success for valid data", () => {
      const result = validateNotificationSettings({
        digestFrequency: "weekly",
        emailEnabled: true,
        alertTypes: ["digest"],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.digestFrequency).toBe("weekly");
      }
    });

    it("should return error for invalid data", () => {
      const result = validateNotificationSettings({
        digestFrequency: "hourly",
        emailEnabled: true,
        alertTypes: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("profileSettingsSchema", () => {
    it("should accept valid profile settings", () => {
      const result = profileSettingsSchema.safeParse({
        name: "Sarah Chen",
        email: "sarah@acme.com",
        timezone: "America/Los_Angeles",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const result = profileSettingsSchema.safeParse({
        name: "",
        email: "sarah@acme.com",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid email", () => {
      const result = profileSettingsSchema.safeParse({
        name: "Sarah",
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("should default timezone to UTC", () => {
      const result = profileSettingsSchema.parse({
        name: "Sarah",
        email: "sarah@acme.com",
      });
      expect(result.timezone).toBe("UTC");
    });
  });
});
