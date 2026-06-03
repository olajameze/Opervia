"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { offlineFetch } from "@/lib/pwa/offline-fetch";

type EquipmentEditDialogProps = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  totalQuantity: number;
  dailyRate: number | null;
};

export function EquipmentEditDialog({
  id,
  name: initialName,
  sku: initialSku,
  category: initialCategory,
  totalQuantity: initialQty,
  dailyRate: initialRate,
}: EquipmentEditDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(initialName);
  const [sku, setSku] = useState(initialSku ?? "");
  const [category, setCategory] = useState(initialCategory ?? "");
  const [totalQuantity, setTotalQuantity] = useState(String(initialQty));
  const [dailyRate, setDailyRate] = useState(initialRate != null ? String(initialRate) : "");

  function open() {
    setName(initialName);
    setSku(initialSku ?? "");
    setCategory(initialCategory ?? "");
    setTotalQuantity(String(initialQty));
    setDailyRate(initialRate != null ? String(initialRate) : "");
    setError("");
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  async function save() {
    setLoading(true);
    setError("");
    const res = await offlineFetch(`/api/equipment/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        sku: sku || null,
        category: category || null,
        setQuantity: Number(totalQuantity),
        dailyRate: dailyRate ? Number(dailyRate) : null,
      }),
    });
    setLoading(false);
    if (!res.ok && res.status !== 202) {
      const data = await res.json();
      setError(data.error ?? "Update failed");
      return;
    }
    close();
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" size="sm" type="button" onClick={open}>
        Edit
      </Button>
      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg backdrop:bg-black/50"
      >
        <h2 className="text-lg font-semibold mb-4">Edit equipment</h2>
        <div className="grid gap-3">
          <label className="text-sm font-medium">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border px-3 text-sm"
            />
          </label>
          <label className="text-sm font-medium">
            SKU
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border px-3 text-sm"
            />
          </label>
          <label className="text-sm font-medium">
            Category
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border px-3 text-sm"
            />
          </label>
          <label className="text-sm font-medium">
            Total quantity
            <input
              type="number"
              min={1}
              value={totalQuantity}
              onChange={(e) => setTotalQuantity(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border px-3 text-sm"
            />
          </label>
          <label className="text-sm font-medium">
            Daily rate (£)
            <input
              type="number"
              min={0}
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border px-3 text-sm"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
