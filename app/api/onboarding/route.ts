import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createOrganization } from "@/lib/services/organization";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { getStripePriceId, getMissingStripePriceEnv, type SubscriptionPlan } from "@/lib/plans";
import { getAppUrl } from "@/lib/app-url";
import { BRAND } from "@/lib/branding";
import { z } from "zod";

const onboardingSchema = z.object({
  organizationName: z.string().min(2),
  plan: z.enum(["STARTER", "PRO", "ENTERPRISE"]).default("PRO"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { organizationName, plan } = onboardingSchema.parse(body);

    const existingMembership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
    });

    if (existingMembership) {
      return NextResponse.json({ error: "Organization already exists" }, { status: 400 });
    }

    const organization = await createOrganization(session.user.id, organizationName);

    if (!isStripeConfigured()) {
      return NextResponse.json({
        organizationId: organization.id,
        slug: organization.slug,
      });
    }

    const priceId = getStripePriceId(plan as SubscriptionPlan);
    const missingEnv = getMissingStripePriceEnv(plan as SubscriptionPlan);

    if (!priceId || missingEnv) {
      return NextResponse.json(
        {
          error: `Stripe price not configured for ${plan}. Set ${missingEnv ?? "STRIPE_PRICE_ENTERPRISE"} in your environment.`,
        },
        { status: 500 }
      );
    }

    const appUrl = getAppUrl();
    const checkoutSession = await createCheckoutSession({
      priceId,
      organizationId: organization.id,
      plan: plan as SubscriptionPlan,
      trialPeriodDays: BRAND.trialDays,
      successUrl: `${appUrl}/dashboard?subscribed=true`,
      cancelUrl: `${appUrl}/onboarding?canceled=true`,
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organizationId: organization.id,
      slug: organization.slug,
      checkoutUrl: checkoutSession.url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Onboarding failed";
    console.error("[onboarding]", message);
    return NextResponse.json({ error: "Onboarding failed" }, { status: 500 });
  }
}
