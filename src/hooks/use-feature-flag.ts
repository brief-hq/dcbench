"use client";

import { useEffect, useState } from "react";
import { posthog } from "@/lib/posthog";

/**
 * Feature flag hook — wraps PostHog's `isFeatureEnabled`.
 *
 * CONVENTION: Always use PostHog feature flags for feature gating.
 * Do NOT use:
 *   - Custom boolean environment variables (e.g., NEXT_PUBLIC_ENABLE_X)
 *   - Hardcoded boolean constants
 *   - Custom feature flag implementations
 *
 * PostHog is the single source of truth for feature flags.
 */
export function useFeatureFlag(flagKey: string): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const check = () => {
      const result = posthog.isFeatureEnabled(flagKey);
      setEnabled(result ?? false);
    };

    check();
    posthog.onFeatureFlags(check);
  }, [flagKey]);

  return enabled;
}
