import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateRangePicker } from "./date-range-picker";

describe("DateRangePicker", () => {
  it("should render with placeholder text", () => {
    render(<DateRangePicker />);
    expect(screen.getByText("Select date range")).toBeInTheDocument();
  });

  it("should render with custom placeholder", () => {
    render(<DateRangePicker placeholder="Pick dates" />);
    expect(screen.getByText("Pick dates")).toBeInTheDocument();
  });

  it("should display formatted date range when from/to are provided", () => {
    render(
      <DateRangePicker
        from={new Date("2024-01-01")}
        to={new Date("2024-01-31")}
      />
    );
    // Uses format "MMM d, yyyy — MMM d, yyyy"
    const button = screen.getByRole("button");
    expect(button.textContent).toContain("2024");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<DateRangePicker disabled />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("should use secondary button variant (read-only action)", () => {
    render(<DateRangePicker />);
    const button = screen.getByRole("button");
    // Secondary variant has border-gray-300
    expect(button.className).toContain("border-gray-300");
  });
});
