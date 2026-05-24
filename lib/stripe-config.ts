import { getAppUrl } from "@/lib/app-url";

export function isStripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return Boolean(key?.startsWith("sk_test_"));
}

export function getStripeWebhookEvents(): string[] {
  return [
    "checkout.session.completed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_failed",
    "invoice.paid",
  ];
}

export function getStripeSetupChecklist() {
  const appUrl = getAppUrl();
  return {
    webhookUrl: `${appUrl}/api/stripe/webhook`,
    events: getStripeWebhookEvents(),
    plans: [
      { id: "STARTER", amount: "£99/month", env: "STRIPE_PRICE_STARTER" },
      { id: "PRO", amount: "£199/month", env: "STRIPE_PRICE_PRO" },
      { id: "ENTERPRISE", amount: "£399/month", env: "STRIPE_PRICE_ENTERPRISE" },
    ],
    portalSettings: [
      "Allow customers to update payment methods",
      "Allow customers to cancel subscriptions",
      "Allow customers to view invoice history",
    ],
  };
}

export function validateStripeProductionConfig(): string[] {
  const warnings: string[] = [];
  const isProd =
    process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";

  if (!isProd) return warnings;

  if (isStripeTestMode()) {
    warnings.push("STRIPE_SECRET_KEY is a test key in production");
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
    warnings.push("STRIPE_WEBHOOK_SECRET is not set");
  }

  for (const env of ["STRIPE_PRICE_STARTER", "STRIPE_PRICE_PRO", "STRIPE_PRICE_ENTERPRISE"]) {
    if (!process.env[env]?.trim()) {
      warnings.push(`${env} is not set`);
    }
  }

  return warnings;
}
