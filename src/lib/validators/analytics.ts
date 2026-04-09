import { z } from "zod";

export const analyticsQuerySchema = z.object({
  eventType: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  teamId: z.string().optional(),
});

export const exportAnalyticsSchema = z.object({
  format: z.enum(["csv", "json"]).default("csv"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  eventTypes: z.array(z.string()).optional(),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type ExportAnalyticsInput = z.infer<typeof exportAnalyticsSchema>;
