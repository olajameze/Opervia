import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateProductionLaunchConfig } from "@/lib/production-config";

describe("production launch config", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports missing required production variables", () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");

    const warnings = validateProductionLaunchConfig();
    expect(warnings.some((warning) => warning.includes("DATABASE_URL"))).toBe(true);
    expect(warnings.some((warning) => warning.includes("AUTH_SECRET"))).toBe(true);
    expect(warnings.some((warning) => warning.includes("Turnstile"))).toBe(true);
  });

  it("returns no warnings outside production runtime", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_SECRET", "");

    expect(validateProductionLaunchConfig()).toEqual([]);
  });
});
