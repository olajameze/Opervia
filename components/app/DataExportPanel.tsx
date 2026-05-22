"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Organization } from "@prisma/client";
import { PLANS } from "@/lib/plans";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Lock } from "lucide-react";

const EXPORT_RESOURCES = [
  { id: "jobs", label: "Jobs" },
  { id: "invoices", label: "Invoices" },
  { id: "equipment", label: "Equipment" },
  { id: "staff", label: "Staff" },
  { id: "freelancers", label: "Freelancers" },
] as const;

export function DataExportPanel({
  organization,
  canExport,
}: {
  organization: Organization;
  canExport: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [exportingAll, setExportingAll] = useState(false);

  async function fetchExport(
    resource: string
  ): Promise<
    { ok: true; blob: Blob; filename: string } | { ok: false; message: string }
  > {
    const res = await fetch(`/api/exports/${resource}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, message: data.error ?? "Export failed" };
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    const filenameMatch = disposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] ?? `opervia-${resource}.csv`;

    return { ok: true, blob, filename };
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function download(resource: string) {
    setLoading(resource);
    setError("");

    try {
      const result = await fetchExport(resource);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      triggerDownload(result.blob, result.filename);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function exportAll() {
    setExportingAll(true);
    setError("");
    const failures: string[] = [];

    for (const resource of EXPORT_RESOURCES) {
      setLoading(resource.id);
      try {
        const result = await fetchExport(resource.id);
        if (!result.ok) {
          failures.push(`${resource.label}: ${result.message}`);
          continue;
        }
        triggerDownload(result.blob, result.filename);
      } catch {
        failures.push(`${resource.label}: Export failed. Please try again.`);
      }
    }

    setLoading(null);
    setExportingAll(false);

    if (failures.length > 0) {
      setError(
        failures.length === EXPORT_RESOURCES.length
          ? `All exports failed. ${failures.join("; ")}`
          : `${failures.length} of ${EXPORT_RESOURCES.length} exports failed: ${failures.join("; ")}`
      );
    }
  }

  if (!canExport) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Bulk data export
          </CardTitle>
          <CardDescription>
            Export jobs, invoices, equipment, and workforce data as CSV files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Available on the Enterprise plan ({PLANS.ENTERPRISE.priceLabel}/mo) — up to{" "}
            {PLANS.ENTERPRISE.maxStaff} staff and {PLANS.ENTERPRISE.maxFreelancers} freelancers.
          </p>
          <LinkButton href="/billing" size="sm">
            Upgrade to Enterprise
          </LinkButton>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Bulk data export
        </CardTitle>
        <CardDescription>
          Download operational data for {organization.name} as CSV files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {EXPORT_RESOURCES.map((resource) => (
            <Button
              key={resource.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={loading !== null}
              onClick={() => download(resource.id)}
            >
              {loading === resource.id ? "Exporting..." : resource.label}
            </Button>
          ))}
        </div>
        <Button type="button" size="sm" disabled={loading !== null} onClick={exportAll}>
          {exportingAll ? "Exporting all..." : "Export all"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
