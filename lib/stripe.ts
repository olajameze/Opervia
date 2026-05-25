import Stripe from "stripe";
import type { SubscriptionPlan } from "@prisma/client";

let cachedStripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment."
    );
  }
  cachedStripe = new Stripe(secret, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
  return cachedStripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function needsSubscriptionSetup(
  org: Pick<{ stripeSubscriptionId: string | null }, "stripeSubscriptionId">
): boolean {
  return isStripeConfigured() && !org.stripeSubscriptionId;
}

export function buildSubscriptionTrialData(
  trialPeriodDays?: number,
  trialEnd?: number
): { trial_period_days?: number; trial_end?: number } {
  if (trialEnd) return { trial_end: trialEnd };
  if (trialPeriodDays) return { trial_period_days: trialPeriodDays };
  return {};
}

export async function createCheckoutSession({
  customerId,
  priceId,
  organizationId,
  plan,
  successUrl,
  cancelUrl,
  trialPeriodDays,
  trialEnd,
}: {
  customerId?: string;
  priceId: string;
  organizationId: string;
  plan: SubscriptionPlan;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
  /** Unix timestamp — use for remaining app trial on legacy orgs. */
  trialEnd?: number;
}) {
  const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
    metadata: { organizationId, plan },
    ...buildSubscriptionTrialData(trialPeriodDays, trialEnd),
  };

  return getStripe().checkout.sessions.create({
    ...(customerId ? { customer: customerId } : {}),
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: subscriptionData,
    metadata: { organizationId, plan },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
) {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
