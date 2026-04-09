import { cn } from "@/lib/utils";

/**
 * ShimmerSkeleton — the preferred loading placeholder component.
 *
 * Uses Tailwind's animation utilities for consistent styling.
 * For the older CSS keyframe approach, see PulseLoader (deprecated).
 */

export interface ShimmerSkeletonProps {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function ShimmerSkeleton({
  variant = "text",
  width,
  height,
  className,
}: ShimmerSkeletonProps) {
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer",
        variantClasses[variant],
        className
      )}
      style={{
        width: width ?? (variant === "text" ? "100%" : undefined),
        height: height ?? (variant === "circular" ? width : undefined),
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Convenience component for rendering multiple skeleton lines.
 */
export function ShimmerSkeletonGroup({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerSkeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}
