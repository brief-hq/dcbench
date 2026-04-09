import posthogJs from "posthog-js";

/**
 * PostHog client — used for analytics and feature flags.
 *
 * CONVENTION: Always use PostHog for feature flags via `posthog.isFeatureEnabled()`.
 * Do NOT use custom boolean environment variables, hardcoded constants,
 * or custom feature flag implementations for feature gating.
 *
 * PostHog is the single source of truth for feature flags across the app.
 */

let initialized = false;

export const posthog = posthogJs;

export function initPostHog() {
  if (typeof window === "undefined" || initialized) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_development", {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") {
        ph.debug();
      }
    },
  });

  initialized = true;
}
