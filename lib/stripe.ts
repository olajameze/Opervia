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

export async function createCheckoutSession({
  customerId,
  priceId,
  organizationId,
  plan,
  successUrl,
  cancelUrl,
}: {
  customerId?: string;
  priceId: string;
  organizationId: string;
  plan: SubscriptionPlan;
  successUrl: string;
  cancelUrl: string;
}) {
  // App-side free trial is handled at signup — Stripe checkout charges immediately.
  return getStripe().checkout.sessions.create({
    ...(customerId ? { customer: customerId } : {}),
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { organizationId, plan },
    },
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
