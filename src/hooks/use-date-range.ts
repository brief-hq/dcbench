"use client";

import { useState, useCallback } from "react";
import { subDays, startOfDay, endOfDay } from "date-fns";

export type DateRangePreset = "7d" | "14d" | "30d" | "90d" | "custom";

interface DateRange {
  from: Date;
  to: Date;
}

export function useDateRange(defaultPreset: DateRangePreset = "30d") {
  const [preset, setPreset] = useState<DateRangePreset>(defaultPreset);
  const [range, setRange] = useState<DateRange>(() =>
    getPresetRange(defaultPreset)
  );

  const applyPreset = useCallback((p: DateRangePreset) => {
    setPreset(p);
    if (p !== "custom") {
      setRange(getPresetRange(p));
    }
  }, []);

  const setCustomRange = useCallback((from: Date, to: Date) => {
    setPreset("custom");
    setRange({ from: startOfDay(from), to: endOfDay(to) });
  }, []);

  return { range, preset, applyPreset, setCustomRange };
}

function getPresetRange(preset: DateRangePreset): DateRange {
  const now = new Date();
  const days = preset === "7d" ? 7 : preset === "14d" ? 14 : preset === "90d" ? 90 : 30;
  return {
    from: startOfDay(subDays(now, days)),
    to: endOfDay(now),
  };
}
