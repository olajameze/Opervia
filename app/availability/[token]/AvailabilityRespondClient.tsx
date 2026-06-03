"use client";

import { useEffect, useState } from "react";
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
    startsAt: Date | null;
    endsAt: Date | null;
  };
  token: string;
  requiredSkills: string[];
  message: string | null;
};

function formatJobDates(job: AvailabilityPageProps["job"]): string | null {
  const start = job.startsAt ?? job.scheduledAt;
  const end = job.endsAt ?? start;
  if (!start) return null;
  if (!end || start.getTime() === end.getTime()) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function AvailabilityRespondClient({
  job,
  token,
  requiredSkills,
  message,
}: AvailabilityPageProps) {
  const searchParams = useSearchParams();
  const freelancerId = searchParams.get("freelancerId") ?? "";
  const intent = searchParams.get("intent");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<"AVAILABLE" | "UNAVAILABLE" | null>(null);

  const dateRange = formatJobDates(job);

  useEffect(() => {
    if (intent === "available") setSelected("AVAILABLE");
    if (intent === "unavailable") setSelected("UNAVAILABLE");
  }, [intent]);

  async function respond(value: "AVAILABLE" | "UNAVAILABLE") {
    if (!freelancerId) {
      setStatus("error");
      return;
    }
    setLoading(true);
    setSelected(value);
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
        <CardDescription>Opervia availability request</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {job.description && <p className="text-sm">{job.description}</p>}
        {job.location && (
          <p className="text-sm">
            <strong>Location:</strong> {job.location}
          </p>
        )}
        {dateRange && (
          <p className="text-sm">
            <strong>Date:</strong> {dateRange}
          </p>
        )}
        {requiredSkills.length > 0 && (
          <p className="text-sm">
            <strong>Skills:</strong> {requiredSkills.join(", ")}
          </p>
        )}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        {status === "success" ? (
          <p className="text-sm text-green-700 dark:text-green-400">
            Thank you — your response has been recorded.
            {selected === "AVAILABLE" &&
              " You have been marked as available for this job."}
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => void respond("AVAILABLE")}
              disabled={loading}
              className={selected === "AVAILABLE" ? "ring-2 ring-primary" : ""}
            >
              I&apos;m available
            </Button>
            <Button
              variant="outline"
              onClick={() => void respond("UNAVAILABLE")}
              disabled={loading}
              className={selected === "UNAVAILABLE" ? "ring-2 ring-primary" : ""}
            >
              Not available
            </Button>
          </div>
        )}
        {status === "error" && (
          <p className="text-sm text-destructive">
            Unable to record your response. Check your link and try again.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
