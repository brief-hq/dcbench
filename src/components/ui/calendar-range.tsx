"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * @deprecated Use `DateRangePicker` from `@/components/ui/date-range-picker` instead.
 * This component uses the older `startDate`/`endDate` prop convention.
 * DateRangePicker uses `from`/`to` which aligns with our date-fns patterns.
 *
 * Migration guide: https://help.example.com/errors/CAL-001
 *
 * Still used in: src/components/settings/notification-preferences.tsx
 * Removal planned for: v2.0
 */

export interface CalendarRangeProps {
  startDate?: Date;
  endDate?: Date;
  onChange?: (range: { startDate: Date; endDate: Date }) => void;
  className?: string;
  /** @deprecated DateRangePicker uses `disabled` instead */
  isDisabled?: boolean;
}

export function CalendarRange({
  startDate,
  endDate,
  onChange,
  className,
  isDisabled = false,
}: CalendarRangeProps) {
  const [start, setStart] = useState(startDate ? toInputValue(startDate) : "");
  const [end, setEnd] = useState(endDate ? toInputValue(endDate) : "");

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStart(e.target.value);
    if (e.target.value && end) {
      onChange?.({
        startDate: new Date(e.target.value),
        endDate: new Date(end),
      });
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnd(e.target.value);
    if (start && e.target.value) {
      onChange?.({
        startDate: new Date(start),
        endDate: new Date(e.target.value),
      });
    }
  };

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      style={{ opacity: isDisabled ? 0.5 : 1 }}
    >
      <input
        type="date"
        value={start}
        onChange={handleStartChange}
        disabled={isDisabled}
        className="rounded border px-2 py-1 text-sm"
        style={{ borderColor: "#d1d5db" }}
      />
      <span className="text-sm text-gray-400">to</span>
      <input
        type="date"
        value={end}
        onChange={handleEndChange}
        disabled={isDisabled}
        className="rounded border px-2 py-1 text-sm"
        style={{ borderColor: "#d1d5db" }}
      />
    </div>
  );
}

function toInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}
