"use client";

import { Button } from "@/components/ui/button";
import type { Organization } from "@prisma/client";
import { PLANS } from "@/lib/plans";

export function BillingActions({ organization }: { organization: Organization }) {
  async function handleCheckout(plan: "STARTER" | "PRO") {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert(data.error ?? "Checkout failed");
  }

  async function handlePortal() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert(data.error ?? "Billing portal unavailable");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {organization.subscriptionStatus === "TRIALING" && (
        <>
          <Button onClick={() => handleCheckout("STARTER")}>
            Subscribe to Starter ({PLANS.STARTER.priceLabel}/mo)
          </Button>
          <Button variant="default" onClick={() => handleCheckout("PRO")}>
            Subscribe to Pro ({PLANS.PRO.priceLabel}/mo)
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
