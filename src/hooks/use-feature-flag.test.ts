import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { posthog } from "@/lib/posthog";
import { useFeatureFlag } from "./use-feature-flag";

// Mock PostHog
vi.mock("@/lib/posthog", () => ({
  posthog: {
    isFeatureEnabled: vi.fn(),
    onFeatureFlags: vi.fn(),
  },
}));

const mockedPosthog = vi.mocked(posthog);

describe("useFeatureFlag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return false by default", () => {
    mockedPosthog.isFeatureEnabled.mockReturnValue(false);
    mockedPosthog.onFeatureFlags.mockImplementation(() => () => {});

    const { result } = renderHook(() => useFeatureFlag("test-flag"));
    expect(result.current).toBe(false);
  });

  it("should return true when flag is enabled", () => {
    mockedPosthog.isFeatureEnabled.mockReturnValue(true);
    mockedPosthog.onFeatureFlags.mockImplementation(() => () => {});

    const { result } = renderHook(() => useFeatureFlag("enabled-flag"));
    expect(result.current).toBe(true);
  });

  it("should call posthog.isFeatureEnabled with the flag key", () => {
    mockedPosthog.isFeatureEnabled.mockReturnValue(false);
    mockedPosthog.onFeatureFlags.mockImplementation(() => () => {});

    renderHook(() => useFeatureFlag("my-feature"));
    expect(mockedPosthog.isFeatureEnabled).toHaveBeenCalledWith("my-feature");
  });

  it("should subscribe to feature flag updates", () => {
    mockedPosthog.isFeatureEnabled.mockReturnValue(false);
    mockedPosthog.onFeatureFlags.mockImplementation(() => () => {});

    renderHook(() => useFeatureFlag("my-feature"));
    expect(mockedPosthog.onFeatureFlags).toHaveBeenCalled();
  });

  it("should handle undefined return from isFeatureEnabled", () => {
    mockedPosthog.isFeatureEnabled.mockReturnValue(undefined as unknown as boolean);
    mockedPosthog.onFeatureFlags.mockImplementation(() => () => {});

    const { result } = renderHook(() => useFeatureFlag("unknown-flag"));
    expect(result.current).toBe(false);
  });
});
