import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildSubscriptionTrialData,
  isStripeConfigured,
  needsSubscriptionSetup,
} from "@/lib/stripe";

describe("stripe checkout trial", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers trial_end over trial_period_days", () => {
    expect(buildSubscriptionTrialData(30, 1_700_000_000)).toEqual({
      trial_end: 1_700_000_000,
    });
  });

  it("uses trial_period_days when trial_end is absent", () => {
    expect(buildSubscriptionTrialData(30)).toEqual({ trial_period_days: 30 });
  });

  it("returns empty trial data when neither value is set", () => {
    expect(buildSubscriptionTrialData()).toEqual({});
  });

  it("detects when subscription setup is required", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    expect(needsSubscriptionSetup({ stripeSubscriptionId: null })).toBe(true);
    expect(needsSubscriptionSetup({ stripeSubscriptionId: "sub_123" })).toBe(false);
  });

  it("skips subscription setup when Stripe is not configured", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(isStripeConfigured()).toBe(false);
    expect(needsSubscriptionSetup({ stripeSubscriptionId: null })).toBe(false);
  });
});
