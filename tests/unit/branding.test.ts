import { describe, it, expect } from "vitest";
import { BRAND, HERO } from "@/lib/branding";

describe("Opervia branding", () => {
  it("has correct product name", () => {
    expect(BRAND.name).toBe("Opervia");
  });

  it("has primary tagline", () => {
    expect(BRAND.tagline).toBe("Run Your Entire Operation From One Platform");
  });

  it("has secondary tagline as hero headline", () => {
    expect(HERO.headline).toBe(BRAND.secondaryTagline);
  });

  it("has 5-day trial", () => {
    expect(BRAND.trialDays).toBe(5);
  });
});
