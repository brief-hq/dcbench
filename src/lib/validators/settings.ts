import { z } from "zod";

/**
 * Settings validation schemas.
 *
 * Note: digestFrequency only supports "daily" and "weekly".
 * Real-time notifications are not supported — see ADR-007.
 */
export const notificationSettingsSchema = z.object({
  digestFrequency: z.enum(["daily", "weekly"]),
  emailEnabled: z.boolean(),
  alertTypes: z.array(z.enum(["digest", "alert", "system"])),
});

export const profileSettingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  avatarUrl: z.string().url().nullable().optional(),
  timezone: z.string().default("UTC"),
});

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type ProfileSettings = z.infer<typeof profileSettingsSchema>;

/**
 * Validates and extracts notification preferences.
 * Ensures only valid digest frequencies are accepted.
 */
export function validateNotificationSettings(
  data: unknown
): { success: true; data: NotificationSettings } | { success: false; error: string } {
  const result = notificationSettingsSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }
  return { success: true, data: result.data };
}
