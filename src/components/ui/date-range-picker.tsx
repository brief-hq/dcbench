"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * DateRangePicker — the preferred date range selection component.
 *
 * Uses `from` / `to` prop convention. For the older `startDate` / `endDate`
 * API, see CalendarRange (deprecated).
 */

export interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onSelect?: (range: { from: Date; to: Date }) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  from,
  to,
  onSelect,
  disabled = false,
  className,
  placeholder = "Select date range",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(from ? formatInputDate(from) : "");
  const [endDate, setEndDate] = useState(to ? formatInputDate(to) : "");

  const handleApply = () => {
    if (startDate && endDate) {
      onSelect?.({
        from: new Date(startDate),
        to: new Date(endDate),
      });
      setIsOpen(false);
    }
  };

  const displayText =
    from && to
      ? `${format(from, "MMM d, yyyy")} — ${format(to, "MMM d, yyyy")}`
      : placeholder;

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="secondary"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-start text-left font-normal"
      >
        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
        <span className={cn(!from && "text-gray-400")}>{displayText}</span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <div className="flex gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApply}
              disabled={!startDate || !endDate}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatInputDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
