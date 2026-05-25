"use client";

import { useState } from "react";
import type { SubscriptionPlan } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanPicker } from "@/components/auth/PlanPicker";
import { BRAND } from "@/lib/branding";

export function CompleteSubscriptionForm({
  organizationName,
  canceled,
}: {
  organizationName: string;
  canceled?: boolean;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan>("PRO");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, source: "onboarding" }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Checkout failed");
      setLoading(false);
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
      return;
    }

    setError("Stripe did not return a checkout URL");
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Complete your subscription</CardTitle>
        <CardDescription>
          {organizationName} is ready. Add a payment method to start your {BRAND.trialDays}-day
          free trial — you won&apos;t be charged until the trial ends.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {canceled && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
              Checkout was canceled. Choose a plan and try again to access {BRAND.name}.
            </p>
          )}
          <PlanPicker value={plan} onChange={setPlan} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-center pt-1">
            <Button type="submit" className="min-w-[200px]" disabled={loading}>
              {loading ? "Redirecting..." : "Continue to secure checkout"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
