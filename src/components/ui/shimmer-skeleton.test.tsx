import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShimmerSkeleton, ShimmerSkeletonGroup } from "./shimmer-skeleton";

describe("ShimmerSkeleton", () => {
  it("should render with default text variant", () => {
    render(<ShimmerSkeleton />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-label", "Loading");
    expect(skeleton.className).toContain("rounded");
  });

  it("should render circular variant", () => {
    render(<ShimmerSkeleton variant="circular" />);
    const skeleton = screen.getByRole("status");
    expect(skeleton.className).toContain("rounded-full");
  });

  it("should render rectangular variant", () => {
    render(<ShimmerSkeleton variant="rectangular" />);
    const skeleton = screen.getByRole("status");
    expect(skeleton.className).toContain("rounded-lg");
  });

  it("should apply custom width and height", () => {
    render(<ShimmerSkeleton width="200px" height="40px" />);
    const skeleton = screen.getByRole("status");
    expect(skeleton.style.width).toBe("200px");
    expect(skeleton.style.height).toBe("40px");
  });

  it("should apply custom className", () => {
    render(<ShimmerSkeleton className="my-custom-class" />);
    const skeleton = screen.getByRole("status");
    expect(skeleton.className).toContain("my-custom-class");
  });
});

describe("ShimmerSkeletonGroup", () => {
  it("should render default 3 skeleton lines", () => {
    render(<ShimmerSkeletonGroup />);
    const skeletons = screen.getAllByRole("status");
    expect(skeletons).toHaveLength(3);
  });

  it("should render specified number of lines", () => {
    render(<ShimmerSkeletonGroup lines={5} />);
    const skeletons = screen.getAllByRole("status");
    expect(skeletons).toHaveLength(5);
  });
});
