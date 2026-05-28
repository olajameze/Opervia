"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type AvailabilityPageProps = {
  job: {
    title: string;
    description: string | null;
    location: string | null;
    scheduledAt: Date | null;
  };
  token: string;
  requiredSkills: string[];
  message: string | null;
};

export function AvailabilityRespondClient({ job, token, requiredSkills, message }: AvailabilityPageProps) {
  const searchParams = useSearchParams();
  const freelancerId = searchParams.get("freelancerId") ?? "";
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);

  async function respond(value: "AVAILABLE" | "UNAVAILABLE") {
    if (!freelancerId) {
      setStatus("error");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/availability/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ freelancerId, status: value }),
    });
    setLoading(false);
    setStatus(res.ok ? "success" : "error");
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{job.title}</CardTitle>
        <CardDescription>Availability request</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {job.description && <p className="text-sm">{job.description}</p>}
        {job.location && <p className="text-sm"><strong>Location:</strong> {job.location}</p>}
        {job.scheduledAt && (
          <p className="text-sm"><strong>Date:</strong> {formatDate(job.scheduledAt)}</p>
        )}
        {requiredSkills.length > 0 && (
          <p className="text-sm"><strong>Skills:</strong> {requiredSkills.join(", ")}</p>
        )}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        {status === "success" ? (
          <p className="text-sm text-success">Thank you — your response has been recorded.</p>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => void respond("AVAILABLE")} disabled={loading}>
              I&apos;m available
            </Button>
            <Button variant="outline" onClick={() => void respond("UNAVAILABLE")} disabled={loading}>
              Not available
            </Button>
          </div>
        )}
        {status === "error" && (
          <p className="text-sm text-destructive">Unable to record your response. Check your link and try again.</p>
        )}
      </CardContent>
    </Card>
  );
}
