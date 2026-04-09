import { ShimmerSkeleton, ShimmerSkeletonGroup } from "@/components/ui/shimmer-skeleton";

/**
 * Settings loading state — uses ShimmerSkeleton (preferred loading pattern).
 */
export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <ShimmerSkeleton variant="text" width="200px" height="28px" />
        <ShimmerSkeleton
          variant="text"
          width="300px"
          height="16px"
          className="mt-2"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ShimmerSkeleton variant="text" width="120px" height="20px" />
        <div className="mt-4">
          <ShimmerSkeletonGroup lines={4} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ShimmerSkeleton variant="text" width="160px" height="20px" />
        <div className="mt-4">
          <ShimmerSkeletonGroup lines={3} />
        </div>
      </div>
    </div>
  );
}
