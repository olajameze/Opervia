"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RegistryRow = Record<string, unknown>;

type RegistryListPanelProps = {
  title: string;
  rows: RegistryRow[];
  columns: { key: string; header: string; render?: (row: RegistryRow) => React.ReactNode }[];
  searchPlaceholder: string;
  filterRow: (row: RegistryRow, query: string) => boolean;
};

export function RegistryListPanel({
  title,
  rows,
  columns,
  searchPlaceholder,
  filterRow,
}: RegistryListPanelProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => filterRow(row, q));
  }, [filterRow, query, rows]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          aria-label={`Search ${title}`}
        />
        <div className="max-h-[280px] overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/50 border-b">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-3 py-2 text-left font-medium text-muted-foreground">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">
                    No matches
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-2">
                        {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {rows.length}
        </p>
      </CardContent>
    </Card>
  );
}
