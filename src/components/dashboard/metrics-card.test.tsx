import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricsCard } from "./metrics-card";

describe("MetricsCard", () => {
  it("should render title and value", () => {
    render(
      <MetricsCard
        title="Total Events"
        value={12847}
        trend="up"
        changePercent={12.3}
      />
    );
    expect(screen.getByText("Total Events")).toBeInTheDocument();
    expect(screen.getByText("12.8K")).toBeInTheDocument();
  });

  it("should display percentage format", () => {
    render(
      <MetricsCard
        title="Error Rate"
        value={2.1}
        trend="down"
        changePercent={0.8}
        format="percent"
      />
    );
    expect(screen.getByText("2.1%")).toBeInTheDocument();
  });

  it("should display currency format", () => {
    render(
      <MetricsCard
        title="Revenue"
        value={5200}
        trend="up"
        changePercent={15}
        format="currency"
      />
    );
    expect(screen.getByText("$5,200")).toBeInTheDocument();
  });

  it("should show change percent", () => {
    render(
      <MetricsCard
        title="Users"
        value={100}
        trend="up"
        changePercent={5.5}
      />
    );
    expect(screen.getByText("5.5%")).toBeInTheDocument();
  });
});
