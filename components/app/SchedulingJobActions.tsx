"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SchedulingJobActions({
  jobId,
  freelancers,
}: {
  jobId: string;
  freelancers: { id: string; name: string; email: string | null }[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const withEmail = freelancers.filter((f) => f.email);

  async function requestAvailability() {
    if (selected.length === 0) return;
    setLoading(true);
    setResult(null);
    const res = await fetch(`/api/jobs/${jobId}/availability-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ freelancerIds: selected, message }),
    });
    const data = await res.json();
    setLoading(false);
    setResult(res.ok ? `Sent to ${data.emailed} freelancer(s)` : data.error ?? "Send failed");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/jobs/${jobId}/export?format=csv`}>CSV</a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/jobs/${jobId}/export?format=pdf`}>PDF</a>
        </Button>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-primary">Request availability</summary>
        <div className="mt-2 space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap gap-2">
            {withEmail.map((freelancer) => (
              <label key={freelancer.id} className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={selected.includes(freelancer.id)}
                  onChange={(e) => {
                    setSelected((prev) =>
                      e.target.checked
                        ? [...prev, freelancer.id]
                        : prev.filter((id) => id !== freelancer.id)
                    );
                  }}
                />
                {freelancer.name}
              </label>
            ))}
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message"
            className="w-full rounded-md border px-3 py-2 text-sm"
            rows={2}
          />
          <Button size="sm" onClick={() => void requestAvailability()} disabled={loading || selected.length === 0}>
            {loading ? "Sending..." : "Send availability email"}
          </Button>
          {result && <p className="text-xs text-muted-foreground">{result}</p>}
        </div>
      </details>
    </div>
  );
}
