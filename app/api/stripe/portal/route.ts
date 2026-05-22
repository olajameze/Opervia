import { NextResponse } from "next/server";
import { createBillingPortalSession } from "@/lib/stripe";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";
import { getAppUrl } from "@/lib/app-url";

export async function POST() {
  const ctx = await requireApiOrganization("billing");
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
  const portal = await createBillingPortalSession(
    ctx.organization.stripeCustomerId,
    `${appUrl}/billing`
  );

  return NextResponse.json({ url: portal.url });
}
