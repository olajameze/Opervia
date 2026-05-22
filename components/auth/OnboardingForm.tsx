"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "@/lib/branding";

export function OnboardingForm() {
  const { update } = useSession();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationName: form.get("organizationName") }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Setup failed");
      setLoading(false);
      return;
    }

    await update();
    window.location.assign("/dashboard");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set up your {BRAND.name} workspace</CardTitle>
        <CardDescription>
          Tell us about your organization to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization name</Label>
            <Input
              id="organizationName"
              name="organizationName"
              required
              placeholder="Acme Equipment Rentals"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-center pt-1">
            <Button type="submit" className="min-w-[200px]" disabled={loading}>
              {loading ? "Setting up..." : "Create workspace"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
