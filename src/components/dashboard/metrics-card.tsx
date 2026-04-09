import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: number;
  trend: "up" | "down" | "flat";
  changePercent: number;
  format?: "number" | "percent" | "currency";
}

export function MetricsCard({
  title,
  value,
  trend,
  changePercent,
  format = "number",
}: MetricsCardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const trendColor =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
        ? "text-red-600"
        : "text-gray-500";

  const formattedValue =
    format === "percent"
      ? `${value}%`
      : format === "currency"
        ? `$${formatNumber(value)}`
        : formatNumber(value);

  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-semibold text-gray-900">
            {formattedValue}
          </p>
          <div className={cn("flex items-center gap-0.5 text-sm", trendColor)}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{Math.abs(changePercent)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
