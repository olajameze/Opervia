import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createCheckoutSession } from "@/lib/stripe";
import { getStripePriceId, type SubscriptionPlan } from "@/lib/plans";
import { getAppUrl } from "@/lib/app-url";
import { denyUnlessApiPermission } from "@/lib/api-auth";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["STARTER", "PRO", "ENTERPRISE"]).default("PRO"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forbidden = denyUnlessApiPermission(session.user.role, "billing.manage");
  if (forbidden) return forbidden;

  const body = schema.parse(await req.json().catch(() => ({})));
  const plan = body.plan as SubscriptionPlan;
  const priceId = getStripePriceId(plan);

  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price not configured for ${plan}` },
      { status: 500 }
    );
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const appUrl = getAppUrl();

  try {
    const checkoutSession = await createCheckoutSession({
      customerId: org.stripeCustomerId ?? undefined,
      priceId,
      organizationId: org.id,
      plan,
      successUrl: `${appUrl}/billing?success=true`,
      cancelUrl: `${appUrl}/billing?canceled=true`,
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout failed";
    console.error("[stripe/checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
