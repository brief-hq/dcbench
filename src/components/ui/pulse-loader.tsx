"use client";

import { cn } from "@/lib/utils";

/**
 * @deprecated Use `ShimmerSkeleton` from `@/components/ui/shimmer-skeleton` instead.
 * PulseLoader uses CSS keyframe animation via inline styles. ShimmerSkeleton
 * uses Tailwind's built-in animation utilities with variant support, which is
 * more consistent with the rest of the design system.
 *
 * Still used in: src/app/dashboard/loading.tsx
 * Removal planned for: v2.0
 */

export interface PulseLoaderProps {
  /** Size of the loader circle */
  size?: "sm" | "md" | "lg";
  /** CSS color value — ShimmerSkeleton uses Tailwind theme colors instead */
  color?: string;
  className?: string;
}

export function PulseLoader({
  size = "md",
  color = "#6366f1",
  className,
}: PulseLoaderProps) {
  const sizeMap = { sm: 24, md: 40, lg: 64 };
  const px = sizeMap[size];

  return (
    <>
      <style>{`
        @keyframes pulse-loader-anim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.85); opacity: 0.5; }
        }
      `}</style>
      <div
        className={cn("rounded-full", className)}
        style={{
          width: px,
          height: px,
          backgroundColor: color,
          animation: "pulse-loader-anim 1.5s ease-in-out infinite",
        }}
        role="status"
        aria-label="Loading"
      />
    </>
  );
}

/**
 * @deprecated Use ShimmerSkeletonGroup instead.
 * Multi-dot variant of the pulse loader.
 */
export function PulseLoaderDots({
  color = "#6366f1",
  className,
}: {
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {[0, 1, 2].map((i) => (
        <PulseLoader key={i} size="sm" color={color} />
      ))}
    </div>
  );
}
