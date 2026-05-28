"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { offlineFetch } from "@/lib/pwa/offline-fetch";

export function AddQuantityButton({ equipmentId }: { equipmentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    const addQuantity = Number(quantity);
    if (!addQuantity || addQuantity < 1) return;
    setLoading(true);
    const res = await offlineFetch(`/api/equipment/${equipmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addQuantity }),
    });
    setLoading(false);
    if (res.ok || res.status === 202) {
      setOpen(false);
      router.refresh();
    } else {
      alert("Failed to add quantity");
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Add qty
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="h-8 w-16 rounded border px-2 text-sm"
        aria-label="Quantity to add"
      />
      <Button size="sm" onClick={() => void handleAdd()} disabled={loading}>
        {loading ? "..." : "Save"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
