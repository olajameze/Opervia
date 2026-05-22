import type { Organization, SubscriptionPlan } from "@prisma/client";

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

const STARTER_MODULES: AppModule[] = [
  "dashboard",
  "rentals",
  "workforce",
  "scheduling",
  "billing",
];

const PRO_MODULES: AppModule[] = [
  ...STARTER_MODULES,
  "logistics",
  "analytics",
  "automations",
];

export const PLANS = {
  STARTER: {
    id: "STARTER" as SubscriptionPlan,
    name: "Starter",
    price: 99,
    priceLabel: "£99",
    period: "/month",
    maxStaff: 5,
    maxFreelancers: 10,
    description: "For small teams getting started with operational management.",
    features: [
      "Up to 5 staff & 10 freelancers",
      "Equipment & rental tracking",
      "Workforce profiles",
      "Job scheduling & dispatch",
      "Basic invoicing",
      "Email notifications",
    ],
    modules: STARTER_MODULES,
  },
  PRO: {
    id: "PRO" as SubscriptionPlan,
    name: "Pro",
    price: 199,
    priceLabel: "£199",
    period: "/month",
    maxStaff: 10,
    maxFreelancers: 20,
    description: "For small to medium businesses that need full operational control.",
    features: [
      "Up to 10 staff & 20 freelancers",
      "Everything in Starter",
      "Logistics tracking",
      "Analytics dashboard",
      "Workflow automations",
      "Priority support",
    ],
    modules: PRO_MODULES,
  },
  ENTERPRISE: {
    id: "ENTERPRISE" as SubscriptionPlan,
    name: "Enterprise",
    price: 399,
    priceLabel: "£399",
    period: "/month",
    maxStaff: 50,
    maxFreelancers: 100,
    description: "For medium and large businesses running complex operations at scale.",
    features: [
      "Up to 50 staff & 100 freelancers",
      "Everything in Pro",
      "Bulk CSV data export",
      "Priority onboarding & support",
      "Advanced operational scale",
    ],
    modules: PRO_MODULES,
  },
} as const;

/** Modules available during the free trial — Starter core + a preview of select Pro features. */
export const TRIAL_MODULES: AppModule[] = [
  "dashboard",
  "rentals",
  "workforce",
  "scheduling",
  "billing",
  "logistics",
  "analytics",
];

/** Days before trial end when we show the upgrade prompt. */
export const TRIAL_ENDING_SOON_DAYS = 2;

export function isOnActiveTrial(
  org: Pick<Organization, "subscriptionStatus" | "trialEndsAt">
): boolean {
  return (
    org.subscriptionStatus === "TRIALING" &&
    org.trialEndsAt != null &&
    org.trialEndsAt > new Date()
  );
}

export function getTrialDaysRemaining(
  org: Pick<Organization, "subscriptionStatus" | "trialEndsAt">
): number | null {
  if (!isOnActiveTrial(org) || !org.trialEndsAt) return null;
  const ms = org.trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function isTrialEndingSoon(
  org: Pick<Organization, "subscriptionStatus" | "trialEndsAt">,
  withinDays = TRIAL_ENDING_SOON_DAYS
): boolean {
  const days = getTrialDaysRemaining(org);
  return days !== null && days <= withinDays;
}

export function getPlanDisplayName(
  org: Pick<Organization, "subscriptionStatus" | "subscriptionPlan" | "trialEndsAt">
): string {
  if (isOnActiveTrial(org)) return "Free Trial";
  return PLANS[getEffectivePlan(org)].name;
}

export function getStripePriceId(plan: SubscriptionPlan): string | undefined {
  if (plan === "STARTER") return process.env.STRIPE_PRICE_STARTER;
  if (plan === "PRO") return process.env.STRIPE_PRICE_PRO;
  if (plan === "ENTERPRISE") return process.env.STRIPE_PRICE_ENTERPRISE;
  return undefined;
}

export function planFromStripePriceId(priceId: string): SubscriptionPlan | null {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "STARTER";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return "ENTERPRISE";
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

/** Trial period ended without an active paid subscription. */
export function isTrialExpired(
  org: Pick<Organization, "subscriptionStatus" | "trialEndsAt">
): boolean {
  return (
    org.subscriptionStatus === "TRIALING" &&
    org.trialEndsAt != null &&
    org.trialEndsAt <= new Date()
  );
}

/** Routes reachable when subscription is inactive (expired trial, canceled, etc.). */
export const INACTIVE_SUBSCRIPTION_PATHS = ["/billing", "/settings"] as const;

export function getEffectivePlan(
  org: Pick<Organization, "subscriptionStatus" | "subscriptionPlan" | "trialEndsAt">
): SubscriptionPlan {
  if (isOnActiveTrial(org)) {
    return "STARTER";
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
  if (isOnActiveTrial(org)) {
    return TRIAL_MODULES.includes(module);
  }
  const plan = getEffectivePlan(org);
  return PLANS[plan].modules.includes(module);
}

type PlanOrg = Pick<Organization, "subscriptionStatus" | "subscriptionPlan" | "trialEndsAt">;

export function getStaffLimit(org: PlanOrg): number {
  return PLANS[getEffectivePlan(org)].maxStaff;
}

export function getFreelancerLimit(org: PlanOrg): number {
  return PLANS[getEffectivePlan(org)].maxFreelancers;
}

/** @deprecated Use getStaffLimit — kept for invite seat checks aligned with staff logins. */
export function getTeamMemberLimit(org: PlanOrg): number {
  return getStaffLimit(org);
}

export function formatStaffLimit(org: PlanOrg): string {
  return String(getStaffLimit(org));
}

export function formatFreelancerLimit(org: PlanOrg): string {
  return String(getFreelancerLimit(org));
}

export function formatTeamMemberLimit(org: PlanOrg): string {
  return formatStaffLimit(org);
}

export function formatPlanStaffLimit(plan: SubscriptionPlan): string {
  return `Up to ${PLANS[plan].maxStaff}`;
}

export function formatPlanFreelancerLimit(plan: SubscriptionPlan): string {
  return `Up to ${PLANS[plan].maxFreelancers}`;
}

export function isStaffLimitReached(org: PlanOrg, currentCount: number): boolean {
  return currentCount >= getStaffLimit(org);
}

export function isFreelancerLimitReached(org: PlanOrg, currentCount: number): boolean {
  return currentCount >= getFreelancerLimit(org);
}

/** @deprecated Use isStaffLimitReached */
export function isTeamMemberLimitReached(org: PlanOrg, currentCount: number): boolean {
  return isStaffLimitReached(org, currentCount);
}

export function isEnterprisePlan(org: PlanOrg): boolean {
  return hasActiveSubscription(org) && getEffectivePlan(org) === "ENTERPRISE";
}

export function canExportData(org: PlanOrg): boolean {
  return isEnterprisePlan(org);
}

export function getStaffUpgradeMessage(org: PlanOrg): string {
  const plan = getEffectivePlan(org);
  if (plan === "STARTER") {
    return `Upgrade to Pro for up to ${PLANS.PRO.maxStaff} staff members.`;
  }
  if (plan === "PRO") {
    return `Upgrade to Enterprise for up to ${PLANS.ENTERPRISE.maxStaff} staff members.`;
  }
  return "Staff limit reached for your plan.";
}

export function getFreelancerUpgradeMessage(org: PlanOrg): string {
  const plan = getEffectivePlan(org);
  if (plan === "STARTER") {
    return `Upgrade to Pro for up to ${PLANS.PRO.maxFreelancers} freelancers.`;
  }
  if (plan === "PRO") {
    return `Upgrade to Enterprise for up to ${PLANS.ENTERPRISE.maxFreelancers} freelancers.`;
  }
  return "Freelancer limit reached for your plan.";
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
  org: Pick<Organization, "subscriptionStatus" | "trialEndsAt">
): boolean {
  return hasActiveSubscription(org);
}
