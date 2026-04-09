import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PulseLoader, PulseLoaderDots } from "./pulse-loader";

/**
 * Tests for PulseLoader — deprecated but still functional.
 * These tests verify the component still works as expected.
 * See shimmer-skeleton.test.tsx for the preferred loading component.
 */
describe("PulseLoader", () => {
  it("should render with default props", () => {
    render(<PulseLoader />);
    const loader = screen.getByRole("status");
    expect(loader).toBeInTheDocument();
    expect(loader).toHaveAttribute("aria-label", "Loading");
  });

  it("should render with small size", () => {
    render(<PulseLoader size="sm" />);
    const loader = screen.getByRole("status");
    expect(loader.style.width).toBe("24px");
    expect(loader.style.height).toBe("24px");
  });

  it("should render with large size", () => {
    render(<PulseLoader size="lg" />);
    const loader = screen.getByRole("status");
    expect(loader.style.width).toBe("64px");
    expect(loader.style.height).toBe("64px");
  });

  it("should apply custom color", () => {
    render(<PulseLoader color="#ff0000" />);
    const loader = screen.getByRole("status");
    expect(loader.style.backgroundColor).toBe("rgb(255, 0, 0)");
  });

  it("should apply custom className", () => {
    render(<PulseLoader className="my-loader" />);
    const loader = screen.getByRole("status");
    expect(loader.className).toContain("my-loader");
  });
});

describe("PulseLoaderDots", () => {
  it("should render three dots", () => {
    render(<PulseLoaderDots />);
    const loaders = screen.getAllByRole("status");
    expect(loaders).toHaveLength(3);
  });
});
