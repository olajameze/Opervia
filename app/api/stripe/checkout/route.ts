import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createCheckoutSession } from "@/lib/stripe";
import {
  getStripePriceId,
  getMissingStripePriceEnv,
  isOnActiveTrial,
  type SubscriptionPlan,
} from "@/lib/plans";
import { getAppUrl } from "@/lib/app-url";
import { denyUnlessApiPermission } from "@/lib/api-auth";
import { BRAND } from "@/lib/branding";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["STARTER", "PRO", "ENTERPRISE"]).default("PRO"),
  source: z.enum(["billing", "onboarding"]).default("billing"),
});

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["TRIALING", "ACTIVE", "PAST_DUE"]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forbidden = denyUnlessApiPermission(session.user.role, "billing.manage");
  if (forbidden) return forbidden;

  const body = schema.parse(await req.json().catch(() => ({})));
  const plan = body.plan as SubscriptionPlan;
  const source = body.source;
  const priceId = getStripePriceId(plan);

  const missingEnv = getMissingStripePriceEnv(plan);
  if (!priceId || missingEnv) {
    return NextResponse.json(
      {
        error: `Stripe price not configured for ${plan}. Set ${missingEnv ?? "STRIPE_PRICE_ENTERPRISE"} in your environment (Vercel → Settings → Environment Variables) and redeploy.`,
      },
      { status: 500 }
    );
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  if (
    org.stripeSubscriptionId &&
    ACTIVE_SUBSCRIPTION_STATUSES.has(org.subscriptionStatus)
  ) {
    return NextResponse.json(
      {
        error: "You already have an active subscription. Use Manage Billing to change your plan.",
      },
      { status: 400 }
    );
  }

  const appUrl = getAppUrl();
  let trialPeriodDays: number | undefined;
  let trialEnd: number | undefined;

  if (!org.stripeSubscriptionId) {
    if (source === "onboarding") {
      if (isOnActiveTrial(org) && org.trialEndsAt && org.trialEndsAt > new Date()) {
        trialEnd = Math.floor(org.trialEndsAt.getTime() / 1000);
      } else {
        trialPeriodDays = BRAND.trialDays;
      }
    } else if (
      isOnActiveTrial(org) &&
      org.trialEndsAt &&
      org.trialEndsAt > new Date()
    ) {
      trialEnd = Math.floor(org.trialEndsAt.getTime() / 1000);
    }
  }

  const isOnboarding = source === "onboarding";

  try {
    const checkoutSession = await createCheckoutSession({
      customerId: org.stripeCustomerId ?? undefined,
      priceId,
      organizationId: org.id,
      plan,
      trialPeriodDays,
      trialEnd,
      successUrl: isOnboarding
        ? `${appUrl}/dashboard?subscribed=true`
        : `${appUrl}/billing?success=true`,
      cancelUrl: isOnboarding
        ? `${appUrl}/onboarding?canceled=true`
        : `${appUrl}/billing?canceled=true`,
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
