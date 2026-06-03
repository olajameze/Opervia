"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

type FreelancerOption = { id: string; name: string; email: string | null };

type AvailabilityResponse = {
  status: string;
  respondedAt: string;
  freelancerProfile: { id: string; name: string };
};

export function SchedulingJobActions({
  jobId,
  freelancers,
}: {
  jobId: string;
  freelancers: FreelancerOption[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [responses, setResponses] = useState<AvailabilityResponse[]>([]);

  const withEmail = freelancers.filter((f) => f.email);

  useEffect(() => {
    void fetch(`/api/jobs/${jobId}/availability-requests`)
      .then((res) => res.json())
      .then((data) => {
        if (data.request?.responses) {
          setResponses(data.request.responses);
        }
      })
      .catch(() => undefined);
  }, [jobId, result]);

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
    if (!res.ok) {
      setResult(data.error ?? "Send failed");
      return;
    }
    const partial =
      Array.isArray(data.failures) && data.failures.length > 0
        ? ` Warning: ${data.failures.join("; ")}`
        : "";
    setResult(`Email sent to ${data.emailed} freelancer(s).${partial}`);
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
          {withEmail.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No freelancers have an email on file. Add an email in Workforce → Freelancers first.
            </p>
          ) : (
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
                {freelancer.name} ({freelancer.email})
              </label>
            ))}
          </div>
          )}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message (job brief, skills, etc.)"
            className="w-full rounded-md border px-3 py-2 text-sm"
            rows={2}
          />
          <Button
            size="sm"
            onClick={() => void requestAvailability()}
            disabled={loading || selected.length === 0 || withEmail.length === 0}
          >
            {loading ? "Sending..." : "Send availability email"}
          </Button>
          {result && <p className="text-xs text-muted-foreground">{result}</p>}
        </div>
      </details>
      {responses.length > 0 && (
        <div className="rounded-md border p-2 text-xs space-y-1">
          <p className="font-medium">Availability responses</p>
          {responses.map((r, i) => (
            <p key={i}>
              {r.freelancerProfile.name}:{" "}
              <span className={r.status === "AVAILABLE" ? "text-green-700" : "text-muted-foreground"}>
                {r.status === "AVAILABLE" ? "Available" : "Not available"}
              </span>
              {r.respondedAt && ` · ${formatDate(new Date(r.respondedAt))}`}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
