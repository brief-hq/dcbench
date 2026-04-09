import { PulseLoader } from "@/components/ui/pulse-loader";

/**
 * Dashboard loading state.
 *
 * Note: This still uses PulseLoader (deprecated). The settings page
 * has been migrated to ShimmerSkeleton — this page should be migrated
 * too, but hasn't been prioritized yet.
 */
export default function DashboardLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <PulseLoader size="lg" color="#6366f1" />
        <p className="text-sm text-gray-500">Loading analytics...</p>
      </div>
    </div>
  );
}
