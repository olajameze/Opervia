"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IMPORT_RESOURCES,
  importTemplateHeaders,
  type ImportResource,
  type ImportRowResult,
} from "@/lib/imports/csv-import";

type DataImportPanelProps = {
  allowedResources?: ImportResource[];
  compact?: boolean;
};

export function DataImportPanel({
  allowedResources,
  compact = false,
}: DataImportPanelProps = {}) {
  const resources = allowedResources ?? IMPORT_RESOURCES;
  const [resource, setResource] = useState<ImportResource>(resources[0]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRowResult[]>([]);

  function downloadTemplate() {
    const headers = importTemplateHeaders(resource);
    const csv = `${headers.join(",")}\n`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `opervia-${resource}-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setSummary(null);
    setRows([]);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/imports/${resource}`, { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setSummary(data.error ?? "Import failed");
      return;
    }
    setSummary(
      `Created ${data.created}, updated ${data.updated}, skipped ${data.skipped}, errors ${data.errors}`
    );
    setRows(data.rows ?? []);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{compact ? "Bulk import" : "Bulk CSV / Excel import"}</CardTitle>
        <CardDescription>
          Import staff, freelancers, equipment, clients, projects, or jobs from CSV or Excel (.xlsx).
          {!compact && " Download a template, fill it in, then upload."}
          {compact && (
            <>
              {" "}
              <Link href="/settings" className="text-primary underline">
                Full import settings
              </Link>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {resources.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setResource(item)}
              className={`rounded-full px-3 py-1 text-sm capitalize ${
                resource === item ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={downloadTemplate}>
            Download template
          </Button>
          <label htmlFor="import-file" className="text-sm font-medium sr-only">
            Spreadsheet file to import
          </label>
          <input
            id="import-file"
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
            aria-label="Spreadsheet file to import"
          />
          <Button type="button" onClick={() => void handleImport()} disabled={!file || loading}>
            {loading ? "Importing..." : "Import"}
          </Button>
        </div>
        {summary && <p className="text-sm text-muted-foreground">{summary}</p>}
        {rows.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-md border text-sm">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Row</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Message</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.row} className="border-t">
                    <td className="px-3 py-1.5">{r.row}</td>
                    <td className="px-3 py-1.5 capitalize">{r.status}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{r.message ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
