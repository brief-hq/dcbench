"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DataPoint {
  label: string;
  value: number;
}

interface ActivityChartProps {
  data: DataPoint[];
  title?: string;
}

/**
 * Simple bar chart for activity visualization.
 * Uses CSS-only rendering — no chart library dependency.
 */
export function ActivityChart({
  data,
  title = "Activity",
}: ActivityChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2" style={{ height: 160 }}>
          {data.map((point) => (
            <div
              key={point.label}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className="w-full rounded-t bg-brand-500 transition-all"
                style={{
                  height: `${(point.value / maxValue) * 140}px`,
                  minHeight: 4,
                }}
              />
              <span className="text-xs text-gray-500">{point.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
