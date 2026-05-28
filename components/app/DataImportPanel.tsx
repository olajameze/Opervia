"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IMPORT_RESOURCES,
  importTemplateHeaders,
  type ImportResource,
} from "@/lib/imports/csv-import";

export function DataImportPanel() {
  const [resource, setResource] = useState<ImportResource>("staff");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/imports/${resource}`, { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setResult(data.error ?? "Import failed");
      return;
    }
    setResult(
      `Created ${data.created}, updated ${data.updated}, skipped ${data.skipped}, errors ${data.errors}`
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk CSV import</CardTitle>
        <CardDescription>
          Import staff, freelancers, equipment, clients, projects, or jobs from a spreadsheet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {IMPORT_RESOURCES.map((item) => (
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
          <label htmlFor="import-csv-file" className="text-sm font-medium sr-only">
            CSV file to import
          </label>
          <input
            id="import-csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
            aria-label="CSV file to import"
          />
          <Button type="button" onClick={() => void handleImport()} disabled={!file || loading}>
            {loading ? "Importing..." : "Import CSV"}
          </Button>
        </div>
        {result && <p className="text-sm text-muted-foreground">{result}</p>}
      </CardContent>
    </Card>
  );
}
