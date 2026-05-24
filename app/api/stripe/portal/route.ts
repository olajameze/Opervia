import { NextResponse } from "next/server";
import { createBillingPortalSession, isStripeConfigured } from "@/lib/stripe";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";
import { getAppUrl } from "@/lib/app-url";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const ctx = await requireApiOrganization("billing", { allowInactiveSubscription: true });
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "billing.manage");
  if (forbidden) return forbidden;

  if (!ctx.organization.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer found. Subscribe to a plan first." },
      { status: 400 }
    );
  }

  const appUrl = getAppUrl();

  try {
    const portal = await createBillingPortalSession(
      ctx.organization.stripeCustomerId,
      `${appUrl}/billing`
    );

    if (!portal.url) {
      return NextResponse.json({ error: "Stripe did not return a portal URL" }, { status: 500 });
    }

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Billing portal failed";
    console.error("[stripe/portal]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
