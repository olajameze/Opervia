import Stripe from "stripe";
import { BRAND } from "@/lib/branding";

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
  plan: "STARTER" | "PRO";
  successUrl: string;
  cancelUrl: string;
}) {
  return getStripe().checkout.sessions.create({
    customer: customerId,
    customer_creation: customerId ? undefined : "always",
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: BRAND.trialDays,
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
