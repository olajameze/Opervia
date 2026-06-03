"use client";

import { useMemo, useState } from "react";
import { SortableDataTable } from "@/components/app/SortableDataTable";
import { EquipmentEditDialog } from "@/components/app/EquipmentEditDialog";
import { AddQuantityButton } from "@/components/app/AddQuantityButton";
import { DeleteButton } from "@/components/app/ModuleForms";

type EquipmentRow = Record<string, unknown> & {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  totalQuantity: number;
  inStock: number;
  outQuantity: number;
  dailyRate: number | null;
  allocations: Array<{
    id: string;
    quantity: number;
    job?: {
      title: string;
      assignments?: Array<{
        staffProfile?: { name: string } | null;
        freelancerProfile?: { name: string } | null;
      }>;
    } | null;
  }>;
};

export function RentalsEquipmentTable({
  rows,
  formatCurrency,
}: {
  rows: EquipmentRow[];
  formatCurrency: (n: number) => string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const haystack = [row.name, row.sku ?? "", row.category ?? ""].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [query, rows]);

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search equipment by name, SKU, or category"
        className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
        aria-label="Search equipment"
      />
      <SortableDataTable
        data={filtered}
        emptyMessage="No equipment added yet. Add your first item to get started."
        columns={[
          { key: "name", header: "Equipment", sortValue: (r) => r.name },
          { key: "sku", header: "SKU", sortValue: (r) => r.sku ?? "" },
          { key: "category", header: "Category", sortValue: (r) => r.category ?? "" },
          { key: "totalQuantity", header: "Total", sortValue: (r) => r.totalQuantity },
          { key: "inStock", header: "In Stock", sortValue: (r) => r.inStock },
          { key: "outQuantity", header: "Out on Jobs", sortValue: (r) => r.outQuantity },
          {
            key: "allocations",
            header: "Allocated to",
            render: (row) => {
              const allocations = row.allocations;
              if (allocations.length === 0) {
                return <span className="text-muted-foreground">—</span>;
              }
              return (
                <div className="space-y-1 text-sm">
                  {allocations.map((allocation) => {
                    const job = allocation.job;
                    const assignee =
                      job?.assignments?.[0]?.staffProfile?.name ??
                      job?.assignments?.[0]?.freelancerProfile?.name;
                    return (
                      <p key={allocation.id}>
                        {allocation.quantity}× {job?.title ?? "Unassigned"}
                        {assignee ? ` (${assignee})` : ""}
                      </p>
                    );
                  })}
                </div>
              );
            },
          },
          {
            key: "dailyRate",
            header: "Daily Rate",
            sortValue: (r) => r.dailyRate ?? 0,
            render: (row) => (row.dailyRate ? formatCurrency(row.dailyRate) : "—"),
          },
          {
            key: "id",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <EquipmentEditDialog
                  id={row.id}
                  name={row.name}
                  sku={row.sku}
                  category={row.category}
                  totalQuantity={row.totalQuantity}
                  dailyRate={row.dailyRate}
                />
                <AddQuantityButton equipmentId={row.id} />
                <DeleteButton endpoint={`/api/equipment/${row.id}`} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
