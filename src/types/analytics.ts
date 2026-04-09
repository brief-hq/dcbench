export interface AnalyticsEvent {
  id: string;
  teamId: string;
  userId: string | null;
  eventType: string;
  metadata: Record<string, unknown> | null;
  value: number | null;
  createdAt: string;
}

export interface MetricsSummary {
  totalEvents: number;
  uniqueUsers: number;
  topEventTypes: { eventType: string; count: number }[];
  trend: "up" | "down" | "flat";
  changePercent: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}
