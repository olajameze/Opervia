"use client";

import { useMemo, useState } from "react";

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
      <select
        id={name}
        name={name}
        required={required}
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        aria-label="Select equipment"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        size={Math.min(6, Math.max(3, filtered.length))}
      >
        <option value="">Select equipment...</option>
        {filtered.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
            {item.sku ? ` · ${item.sku}` : ""}
            {item.category ? ` · ${item.category}` : ""} — {item.inStock} in stock
          </option>
        ))}
      </select>
      {selected && (
        <p className="text-xs text-muted-foreground">
          {selected.inStock} available in stock
        </p>
      )}
    </div>
  );
}
