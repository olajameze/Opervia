"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MaintenanceConsole({
  initialMaintenanceMode,
  initialMessage,
}: {
  initialMaintenanceMode: boolean;
  initialMessage: string;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialMaintenanceMode);
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);

  async function save(enabledValue: boolean) {
    setLoading(true);
    const res = await fetch("/api/admin/system", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        maintenanceMode: enabledValue,
        maintenanceMessage: message || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      alert("Failed to update maintenance mode");
      return;
    }
    setEnabled(enabledValue);
    router.refresh();
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Maintenance mode</CardTitle>
            <CardDescription>
              When enabled, users see a maintenance screen instead of the application.
            </CardDescription>
          </div>
          <Badge variant={enabled ? "destructive" : "secondary"}>
            {enabled ? "Active" : "Off"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="maintenance-message" className="text-sm font-medium">
            Public message
          </label>
          <textarea
            id="maintenance-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="We will be back running shortly."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={loading} onClick={() => save(true)}>
            Enable maintenance
          </Button>
          <Button variant="outline" disabled={loading} onClick={() => save(false)}>
            Disable maintenance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
