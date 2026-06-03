"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type SortDir = "asc" | "desc";

export type SortableColumn<T> = {
  key: keyof T | string;
  header: string;
  sortValue?: (row: T) => string | number | Date | null;
  render?: (row: T) => React.ReactNode;
};

interface SortableDataTableProps<T extends Record<string, unknown>> {
  columns: SortableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  /** Enables a scrollable body (~10 rows visible). */
  scrollable?: boolean;
}

function compareValues(a: unknown, b: unknown, dir: SortDir): number {
  const mult = dir === "asc" ? 1 : -1;
  if (a == null && b == null) return 0;
  if (a == null) return 1 * mult;
  if (b == null) return -1 * mult;
  if (a instanceof Date && b instanceof Date) {
    return (a.getTime() - b.getTime()) * mult;
  }
  if (typeof a === "number" && typeof b === "number") {
    return (a - b) * mult;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true }) * mult;
}

export function SortableDataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No data found",
  scrollable = false,
}: SortableDataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => String(c.key) === sortKey);
    if (!col) return data;
    return [...data].sort((a, b) => {
      const av = col.sortValue ? col.sortValue(a) : a[col.key as keyof T];
      const bv = col.sortValue ? col.sortValue(b) : b[col.key as keyof T];
      return compareValues(av, bv, sortDir);
    });
  }, [columns, data, sortDir, sortKey]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border p-12 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("min-w-0 rounded-lg border overflow-hidden", scrollable && "flex flex-col")}>
      <div
        className={cn(
          "overflow-x-auto",
          scrollable && "max-h-[400px] overflow-y-auto flex-1"
        )}
      >
        <table className="w-full min-w-[32rem] text-sm">
          <thead className="sticky top-0 z-10 bg-muted/50">
            <tr className="border-b">
              {columns.map((col) => (
                <th key={String(col.key)} className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort(String(col.key))}
                  >
                    {col.header}
                    {sortKey === String(col.key) && (
                      <span className="text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i} className={cn("border-b last:border-0 hover:bg-muted/30")}>
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3">
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
