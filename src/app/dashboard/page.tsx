"use client";

import { useState } from "react";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ExportButton } from "@/components/dashboard/export-button";
import { Button } from "@/components/ui/button";
import { useFeatureFlag } from "@/hooks/use-feature-flag";

const metrics = [
  { title: "Page Views", value: 45231, trend: "up" as const, changePercent: 8.2 },
  { title: "Feature Usage", value: 8943, trend: "up" as const, changePercent: 15.7 },
  { title: "API Calls", value: 128400, trend: "up" as const, changePercent: 3.4 },
  { title: "Errors", value: 47, trend: "down" as const, changePercent: 22.1 },
];

const chartData = [
  { label: "Jan", value: 3200 },
  { label: "Feb", value: 3800 },
  { label: "Mar", value: 4100 },
  { label: "Apr", value: 3900 },
  { label: "May", value: 4500 },
  { label: "Jun", value: 5200 },
];

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 86400000),
    to: new Date(),
  });
  const showAdvancedMetrics = useFeatureFlag("advanced-metrics");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-500">
            Detailed analytics for your team
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onSelect={setDateRange}
            className="w-72"
          />
          {/* variant="secondary" for read-only/export action */}
          <ExportButton
            startDate={dateRange.from}
            endDate={dateRange.to}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricsCard key={metric.title} {...metric} />
        ))}
      </div>

      <ActivityChart data={chartData} title="Monthly Trend" />

      {showAdvancedMetrics && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-medium text-brand-700">
            Advanced metrics are enabled for your account.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {/* variant="secondary" for read-only filter actions */}
        <Button variant="secondary">Last 7 days</Button>
        <Button variant="secondary">Last 30 days</Button>
        <Button variant="secondary">Last 90 days</Button>
      </div>
    </div>
  );
}
