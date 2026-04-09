"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonProps {
  /** Date range for the export */
  startDate: Date;
  endDate: Date;
  format?: "csv" | "json";
}

/**
 * Export button for analytics data.
 *
 * IMPORTANT: The server-side export endpoint uses `withAuditLog` to comply
 * with data governance policy DG-003. All data exports are logged.
 *
 * Uses variant="secondary" because this is a read-only/export action,
 * not a mutation. See Button component conventions.
 */
export function ExportButton({
  startDate,
  endDate,
  format = "csv",
}: ExportButtonProps) {
  const toast = useToast();

  const handleExport = async () => {
    try {
      toast.loading("Preparing export...");

      const response = await fetch("/api/analytics/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          format,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(
          error.help
            ? `Export failed. See ${error.help}`
            : "Export failed. Please try again."
        );
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-export.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Export downloaded successfully");
    } catch {
      toast.error(
        "Export failed. See https://help.example.com/errors/EXPORT_001"
      );
    }
  };

  return (
    <Button variant="secondary" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export
    </Button>
  );
}
