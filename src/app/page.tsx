import { MetricsCard } from "@/components/dashboard/metrics-card";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { TeamPerformance } from "@/components/dashboard/team-performance";
import { DateRangePicker } from "@/components/ui/date-range-picker";

// Static demo data — in production this would come from the API
const metrics = [
  { title: "Total Events", value: 12847, trend: "up" as const, changePercent: 12.3 },
  { title: "Active Users", value: 284, trend: "up" as const, changePercent: 4.1 },
  { title: "Error Rate", value: 2.1, trend: "down" as const, changePercent: 0.8, format: "percent" as const },
  { title: "Avg Response", value: 142, trend: "flat" as const, changePercent: 0.2 },
];

const activityData = [
  { label: "Mon", value: 420 },
  { label: "Tue", value: 380 },
  { label: "Wed", value: 510 },
  { label: "Thu", value: 470 },
  { label: "Fri", value: 390 },
  { label: "Sat", value: 120 },
  { label: "Sun", value: 90 },
];

const teamMembers = [
  { name: "Sarah Chen", role: "Admin", eventsToday: 847, status: "active" as const },
  { name: "Marcus Rodriguez", role: "Member", eventsToday: 523, status: "active" as const },
  { name: "Jamie Park", role: "Viewer", eventsToday: 0, status: "offline" as const },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
          <p className="text-sm text-gray-500">
            Team performance at a glance
          </p>
        </div>
        <DateRangePicker
          from={new Date(Date.now() - 30 * 86400000)}
          to={new Date()}
          className="w-72"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricsCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActivityChart data={activityData} title="Weekly Activity" />
        <TeamPerformance members={teamMembers} />
      </div>
    </div>
  );
}
