"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AutomationActions() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function handleEvaluate() {
    setLoading(true);
    const res = await fetch("/api/workflows/evaluate", { method: "POST" });
    if (res.ok) {
      setResult("Rules evaluated successfully");
      window.location.reload();
    } else {
      setResult("Evaluation failed");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
      <Button onClick={handleEvaluate} disabled={loading}>
        {loading ? "Evaluating..." : "Run Evaluation"}
      </Button>
    </div>
  );
}
