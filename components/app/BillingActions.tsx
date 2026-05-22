"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Organization, SubscriptionPlan } from "@prisma/client";
import { PLANS } from "@/lib/plans";

export function BillingActions({ organization }: { organization: Organization }) {
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);

  const canSubscribe =
    organization.subscriptionStatus === "TRIALING" ||
    organization.subscriptionStatus === "CANCELED" ||
    !organization.stripeSubscriptionId;

  async function handleCheckout(plan: SubscriptionPlan) {
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
            variant="outline"
            onClick={() => handleCheckout("STARTER")}
            disabled={loadingPlan !== null}
          >
            {loadingPlan === "STARTER"
              ? "Redirecting..."
              : `Starter (${PLANS.STARTER.priceLabel}/mo)`}
          </Button>
          <Button onClick={() => handleCheckout("PRO")} disabled={loadingPlan !== null}>
            {loadingPlan === "PRO"
              ? "Redirecting..."
              : `Pro (${PLANS.PRO.priceLabel}/mo)`}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleCheckout("ENTERPRISE")}
            disabled={loadingPlan !== null}
          >
            {loadingPlan === "ENTERPRISE"
              ? "Redirecting..."
              : `Enterprise (${PLANS.ENTERPRISE.priceLabel}/mo)`}
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
