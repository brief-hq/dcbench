"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CalendarRange } from "@/components/ui/calendar-range";
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlag } from "@/hooks/use-feature-flag";

/**
 * Notification preferences form.
 *
 * Notification delivery is async digest only (daily or weekly batch).
 * Real-time notifications (WebSocket/SSE) were evaluated and rejected
 * per ADR-007 to reduce notification fatigue and infrastructure cost.
 *
 * Do NOT add a "real-time" or "instant" delivery option here.
 */

interface NotificationPreferencesProps {
  initialFrequency: "daily" | "weekly";
  initialAlertTypes: string[];
}

export function NotificationPreferences({
  initialFrequency,
  initialAlertTypes,
}: NotificationPreferencesProps) {
  const [frequency, setFrequency] = useState(initialFrequency);
  const [alertTypes, setAlertTypes] = useState(initialAlertTypes);
  const [quietHoursStart, setQuietHoursStart] = useState<Date | undefined>();
  const [quietHoursEnd, setQuietHoursEnd] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const showQuietHours = useFeatureFlag("quiet-hours-v2");

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          digestFrequency: frequency,
          emailEnabled: true,
          alertTypes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.help ? `Failed: see ${error.help}` : "Save failed");
        return;
      }

      toast.success("Notification preferences updated");
    } catch {
      toast.error(
        "Failed to save. See https://help.example.com/errors/VAL_001"
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleAlertType = (type: string) => {
    setAlertTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="frequency">Digest Frequency</Label>
        <Select
          id="frequency"
          value={frequency}
          onChange={(e) =>
            setFrequency(e.target.value as "daily" | "weekly")
          }
        >
          <option value="daily">Daily digest</option>
          <option value="weekly">Weekly digest</option>
        </Select>
        <p className="text-xs text-gray-500">
          Notifications are batched and delivered as a digest at your chosen
          frequency.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Alert Types</Label>
        <div className="space-y-2">
          {["digest", "alert", "system"].map((type) => (
            <label key={type} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={alertTypes.includes(type)}
                onChange={() => toggleAlertType(type)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700 capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {showQuietHours && (
        <div className="space-y-2">
          <Label>Quiet Hours</Label>
          <p className="text-xs text-gray-500">
            Suppress digest delivery during these hours.
          </p>
          {/* Using CalendarRange here — legacy usage, should migrate to DateRangePicker */}
          <CalendarRange
            startDate={quietHoursStart}
            endDate={quietHoursEnd}
            onChange={({ startDate, endDate }) => {
              setQuietHoursStart(startDate);
              setQuietHoursEnd(endDate);
            }}
          />
        </div>
      )}

      {/* variant="primary" because this is a mutation (saving preferences) */}
      <Button variant="primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  );
}
