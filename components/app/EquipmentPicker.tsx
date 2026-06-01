"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type EquipmentOption = {
  id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  inStock: number;
};

export function EquipmentPicker({
  equipment,
  name = "equipmentId",
  required = true,
}: {
  equipment: EquipmentOption[];
  name?: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return equipment;
    return equipment.filter((item) => {
      const haystack = [item.name, item.sku ?? "", item.category ?? ""].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [equipment, query]);

  const selected = equipment.find((item) => item.id === selectedId);

  return (
    <div className="space-y-2 sm:col-span-2">
      <label htmlFor="equipment-search" className="text-sm font-medium">
        Equipment
      </label>
      <input
        id="equipment-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, SKU, or category"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      />
      <div
        role="group"
        aria-label="Select equipment"
        className="min-h-[280px] max-h-[360px] overflow-y-auto rounded-md border border-input bg-background"
      >
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No equipment matches your search
          </p>
        ) : (
          filtered.map((item, index) => {
            const isSelected = item.id === selectedId;
            const inputId = `equipment-option-${item.id}`;
            return (
              <label
                key={item.id}
                htmlFor={inputId}
                className={cn(
                  "flex w-full cursor-pointer items-start justify-between gap-3 border-b border-input px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/50",
                  isSelected && "border-primary bg-muted/50"
                )}
              >
                <input
                  id={inputId}
                  type="radio"
                  name={name}
                  value={item.id}
                  checked={isSelected}
                  onChange={() => setSelectedId(item.id)}
                  required={required && index === 0}
                  className="sr-only"
                />
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[item.sku, item.category].filter(Boolean).join(" · ") || "No SKU or category"}
                  </p>
                </div>
                <Badge variant={item.inStock > 0 ? "secondary" : "outline"} className="shrink-0">
                  {item.inStock} in stock
                </Badge>
              </label>
            );
          })
        )}
      </div>
      {selected && (
        <p className="text-xs text-muted-foreground">
          Selected: {selected.name} — {selected.inStock} available in stock
        </p>
      )}
    </div>
  );
}
