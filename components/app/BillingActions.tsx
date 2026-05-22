"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Organization } from "@prisma/client";
import { PLANS } from "@/lib/plans";

export function BillingActions({ organization }: { organization: Organization }) {
  const [loadingPlan, setLoadingPlan] = useState<"STARTER" | "PRO" | null>(null);

  const canSubscribe =
    organization.subscriptionStatus === "TRIALING" ||
    organization.subscriptionStatus === "CANCELED" ||
    !organization.stripeSubscriptionId;

  async function handleCheckout(plan: "STARTER" | "PRO") {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data.error ?? "Checkout failed. Please try again.");
    } catch {
      alert("Checkout failed. Please check your connection and try again.");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handlePortal() {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data.error ?? "Billing portal unavailable");
    } catch {
      alert("Could not open billing portal. Please try again.");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canSubscribe && (
        <>
          <Button
            onClick={() => handleCheckout("STARTER")}
            disabled={loadingPlan !== null}
          >
            {loadingPlan === "STARTER"
              ? "Redirecting..."
              : `Subscribe to Starter (${PLANS.STARTER.priceLabel}/mo)`}
          </Button>
          <Button
            variant="default"
            onClick={() => handleCheckout("PRO")}
            disabled={loadingPlan !== null}
          >
            {loadingPlan === "PRO"
              ? "Redirecting..."
              : `Subscribe to Pro (${PLANS.PRO.priceLabel}/mo)`}
          </Button>
        </>
      )}
      {organization.stripeCustomerId && (
        <Button variant="outline" onClick={handlePortal}>
          Manage Billing
        </Button>
      )}
    </div>
  );
}
