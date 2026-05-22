import { describe, it, expect } from "vitest";
import {
  hasActiveSubscription,
  canAccessModule,
  getEffectivePlan,
  getTeamMemberLimit,
  formatTeamMemberLimit,
  isTeamMemberLimitReached,
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

const expiredOrg = {
  subscriptionStatus: "TRIALING" as const,
  subscriptionPlan: null,
  trialEndsAt: new Date(Date.now() - 86400000),
};

describe("plans", () => {
  it("defines Starter and Pro pricing", () => {
    expect(PLANS.STARTER.priceLabel).toBe("£29");
    expect(PLANS.PRO.priceLabel).toBe("£59");
  });

  it("limits trial to Starter plus Pro previews", () => {
    expect(getEffectivePlan(trialingOrg)).toBe("STARTER");
    expect(canAccessModule(trialingOrg, "rentals")).toBe(true);
    expect(canAccessModule(trialingOrg, "logistics")).toBe(true);
    expect(canAccessModule(trialingOrg, "analytics")).toBe(true);
    expect(canAccessModule(trialingOrg, "automations")).toBe(false);
    expect(getTeamMemberLimit(trialingOrg)).toBe(5);
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

  it("limits team members by plan", () => {
    expect(getTeamMemberLimit(starterOrg)).toBe(5);
    expect(getTeamMemberLimit(proOrg)).toBeNull();
    expect(formatTeamMemberLimit(proOrg)).toBe("Unlimited");
  });

  it("never blocks Pro plan team growth", () => {
    expect(isTeamMemberLimitReached(proOrg, 1000)).toBe(false);
    expect(isTeamMemberLimitReached(starterOrg, 5)).toBe(true);
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
});
