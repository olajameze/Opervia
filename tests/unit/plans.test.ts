import { describe, it, expect } from "vitest";
import {
  hasActiveSubscription,
  canAccessModule,
  getEffectivePlan,
  getStaffLimit,
  getFreelancerLimit,
  formatStaffLimit,
  formatFreelancerLimit,
  isStaffLimitReached,
  isFreelancerLimitReached,
  isEnterprisePlan,
  canExportData,
  isTrialExpired,
  subscriptionIsWritable,
  INACTIVE_SUBSCRIPTION_PATHS,
  PLANS,
} from "@/lib/plans";

const trialingOrg = {
  subscriptionStatus: "TRIALING" as const,
  subscriptionPlan: null,
  trialEndsAt: new Date(Date.now() + 86400000),
};

const starterOrg = {
  subscriptionStatus: "ACTIVE" as const,
  subscriptionPlan: "STARTER" as const,
  trialEndsAt: null,
};

const proOrg = {
  subscriptionStatus: "ACTIVE" as const,
  subscriptionPlan: "PRO" as const,
  trialEndsAt: null,
};

const enterpriseOrg = {
  subscriptionStatus: "ACTIVE" as const,
  subscriptionPlan: "ENTERPRISE" as const,
  trialEndsAt: null,
};

const expiredOrg = {
  subscriptionStatus: "TRIALING" as const,
  subscriptionPlan: null,
  trialEndsAt: new Date(Date.now() - 86400000),
};

describe("plans", () => {
  it("defines Starter, Pro, and Enterprise pricing", () => {
    expect(PLANS.STARTER.priceLabel).toBe("£99");
    expect(PLANS.PRO.priceLabel).toBe("£199");
    expect(PLANS.ENTERPRISE.priceLabel).toBe("£399");
  });

  it("limits trial to Starter plus Pro previews", () => {
    expect(getEffectivePlan(trialingOrg)).toBe("STARTER");
    expect(canAccessModule(trialingOrg, "rentals")).toBe(true);
    expect(canAccessModule(trialingOrg, "logistics")).toBe(true);
    expect(canAccessModule(trialingOrg, "analytics")).toBe(true);
    expect(canAccessModule(trialingOrg, "automations")).toBe(false);
    expect(getStaffLimit(trialingOrg)).toBe(5);
    expect(getFreelancerLimit(trialingOrg)).toBe(10);
  });

  it("restricts Starter plan modules", () => {
    expect(canAccessModule(starterOrg, "rentals")).toBe(true);
    expect(canAccessModule(starterOrg, "analytics")).toBe(false);
    expect(canAccessModule(starterOrg, "automations")).toBe(false);
  });

  it("allows all modules on Pro plan", () => {
    expect(canAccessModule(proOrg, "analytics")).toBe(true);
    expect(canAccessModule(proOrg, "automations")).toBe(true);
  });

  it("limits staff and freelancers by plan", () => {
    expect(getStaffLimit(starterOrg)).toBe(5);
    expect(getFreelancerLimit(starterOrg)).toBe(10);
    expect(getStaffLimit(proOrg)).toBe(10);
    expect(getFreelancerLimit(proOrg)).toBe(20);
    expect(getStaffLimit(enterpriseOrg)).toBe(50);
    expect(getFreelancerLimit(enterpriseOrg)).toBe(100);
    expect(formatStaffLimit(proOrg)).toBe("10");
    expect(formatFreelancerLimit(proOrg)).toBe("20");
  });

  it("blocks growth when plan limits are reached", () => {
    expect(isStaffLimitReached(proOrg, 10)).toBe(true);
    expect(isStaffLimitReached(proOrg, 9)).toBe(false);
    expect(isFreelancerLimitReached(starterOrg, 10)).toBe(true);
    expect(isFreelancerLimitReached(starterOrg, 9)).toBe(false);
  });

  it("gates bulk export to Enterprise only", () => {
    expect(canExportData(proOrg)).toBe(false);
    expect(canExportData(enterpriseOrg)).toBe(true);
    expect(isEnterprisePlan(enterpriseOrg)).toBe(true);
    expect(isEnterprisePlan(proOrg)).toBe(false);
  });
});

describe("entitlements", () => {
  it("allows active subscriptions", () => {
    expect(hasActiveSubscription(starterOrg)).toBe(true);
    expect(hasActiveSubscription(trialingOrg)).toBe(true);
  });

  it("denies expired trials", () => {
    expect(hasActiveSubscription(expiredOrg)).toBe(false);
    expect(canAccessModule(expiredOrg, "billing")).toBe(true);
    expect(canAccessModule(expiredOrg, "rentals")).toBe(false);
  });

  it("identifies expired trial state", () => {
    expect(isTrialExpired(expiredOrg)).toBe(true);
    expect(isTrialExpired(trialingOrg)).toBe(false);
    expect(subscriptionIsWritable(expiredOrg)).toBe(false);
    expect(subscriptionIsWritable(starterOrg)).toBe(true);
    expect(INACTIVE_SUBSCRIPTION_PATHS).toContain("/billing");
    expect(INACTIVE_SUBSCRIPTION_PATHS).toContain("/settings");
  });
});
