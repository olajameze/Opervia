import type { Organization, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export type { SubscriptionPlan };

export type AppModule =
  | "dashboard"
  | "rentals"
  | "workforce"
  | "scheduling"
  | "billing"
  | "logistics"
  | "analytics"
  | "automations";

export const PLANS = {
  STARTER: {
    id: "STARTER" as SubscriptionPlan,
    name: "Starter",
    price: 29,
    priceLabel: "£29",
    period: "/month",
    maxTeamMembers: 5,
    description: "For small teams getting started with operational management.",
    features: [
      "Up to 5 team members",
      "Equipment & rental tracking",
      "Workforce profiles",
      "Job scheduling & dispatch",
      "Basic invoicing",
      "Email notifications",
    ],
    modules: [
      "dashboard",
      "rentals",
      "workforce",
      "scheduling",
      "billing",
    ] as AppModule[],
  },
  PRO: {
    id: "PRO" as SubscriptionPlan,
    name: "Pro",
    price: 59,
    priceLabel: "£59",
    period: "/month",
    maxTeamMembers: null as number | null,
    description: "For growing teams that need full operational control.",
    features: [
      "Unlimited team members",
      "Everything in Starter",
      "Logistics tracking",
      "Analytics dashboard",
      "Workflow automations",
      "Stripe billing integration",
      "Priority support",
    ],
    modules: [
      "dashboard",
      "rentals",
      "workforce",
      "scheduling",
      "billing",
      "logistics",
      "analytics",
      "automations",
    ] as AppModule[],
  },
} as const;

export function getStripePriceId(plan: SubscriptionPlan): string | undefined {
  if (plan === "STARTER") return process.env.STRIPE_PRICE_STARTER;
  if (plan === "PRO") return process.env.STRIPE_PRICE_PRO;
  return undefined;
}

export function planFromStripePriceId(priceId: string): SubscriptionPlan | null {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "STARTER";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  return null;
}

export function hasActiveSubscription(
  org: Pick<Organization, "subscriptionStatus" | "trialEndsAt">
): boolean {
  if (org.subscriptionStatus === "ACTIVE") return true;
  if (org.subscriptionStatus === "TRIALING" && org.trialEndsAt) {
    return org.trialEndsAt > new Date();
  }
  return false;
}

export function getEffectivePlan(
  org: Pick<Organization, "subscriptionStatus" | "subscriptionPlan" | "trialEndsAt">
): SubscriptionPlan {
  if (
    org.subscriptionStatus === "TRIALING" &&
    org.trialEndsAt &&
    org.trialEndsAt > new Date()
  ) {
    return "PRO";
  }
  if (org.subscriptionStatus === "ACTIVE" && org.subscriptionPlan) {
    return org.subscriptionPlan;
  }
  return "STARTER";
}

export function canAccessModule(
  org: Pick<Organization, "subscriptionStatus" | "subscriptionPlan" | "trialEndsAt">,
  module: AppModule
): boolean {
  if (!hasActiveSubscription(org)) {
    return module === "billing";
  }
  const plan = getEffectivePlan(org);
  return PLANS[plan].modules.includes(module);
}

export function getTeamMemberLimit(
  org: Pick<Organization, "subscriptionStatus" | "subscriptionPlan" | "trialEndsAt">
): number | null {
  return PLANS[getEffectivePlan(org)].maxTeamMembers;
}

export function formatTeamMemberLimit(
  org: Pick<Organization, "subscriptionStatus" | "subscriptionPlan" | "trialEndsAt">
): string {
  const limit = getTeamMemberLimit(org);
  return limit === null ? "Unlimited" : String(limit);
}

export function isTeamMemberLimitReached(
  org: Pick<Organization, "subscriptionStatus" | "subscriptionPlan" | "trialEndsAt">,
  currentCount: number
): boolean {
  const limit = getTeamMemberLimit(org);
  if (limit === null) return false;
  return currentCount >= limit;
}

export function modulePath(module: AppModule): string {
  const paths: Record<AppModule, string> = {
    dashboard: "/dashboard",
    rentals: "/rentals",
    workforce: "/workforce",
    scheduling: "/scheduling",
    billing: "/billing",
    logistics: "/logistics",
    analytics: "/analytics",
    automations: "/automations",
  };
  return paths[module];
}

export function pathToModule(pathname: string): AppModule | null {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/rentals")) return "rentals";
  if (pathname.startsWith("/workforce")) return "workforce";
  if (pathname.startsWith("/scheduling")) return "scheduling";
  if (pathname.startsWith("/billing")) return "billing";
  if (pathname.startsWith("/logistics")) return "logistics";
  if (pathname.startsWith("/analytics")) return "analytics";
  if (pathname.startsWith("/automations")) return "automations";
  return null;
}

export function subscriptionIsWritable(
  status: SubscriptionStatus | null | undefined
): boolean {
  return status === "ACTIVE" || status === "TRIALING";
}
