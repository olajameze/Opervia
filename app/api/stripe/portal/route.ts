import { NextResponse } from "next/server";
import { createBillingPortalSession } from "@/lib/stripe";
import { requireApiOrganization } from "@/lib/api-auth";

export async function POST() {
  const ctx = await requireApiOrganization("billing");
  if ("error" in ctx) return ctx.error;

  if (!ctx.organization.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer found. Subscribe to a plan first." },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const portal = await createBillingPortalSession(
    ctx.organization.stripeCustomerId,
    `${appUrl}/billing`
  );

  return NextResponse.json({ url: portal.url });
}
