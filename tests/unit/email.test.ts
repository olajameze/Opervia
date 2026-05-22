import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getEmailConfigError,
  isEmailConfigured,
  sendEmail,
  validateProductionEmailConfig,
  warnProductionEmailConfig,
} from "@/lib/email";

describe("email", () => {
  const env = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("detects missing configuration", () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
    expect(isEmailConfigured()).toBe(false);
    expect(getEmailConfigError()).toBe("RESEND_API_KEY is not set");
  });

  it("treats placeholder API keys as missing configuration", () => {
    vi.stubEnv("RESEND_API_KEY", "re_xxxxxxxxx");
    vi.stubEnv("RESEND_FROM", "onboarding@resend.dev");
    expect(isEmailConfigured()).toBe(false);
    expect(getEmailConfigError()).toBe("RESEND_API_KEY is not set");
  });

  it("logs instead of sending in development when misconfigured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "development");
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test",
      text: "Hello",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.dev).toBe(true);
    expect(logSpy).toHaveBeenCalled();
  });

  it("returns an error in production when misconfigured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test",
      text: "Hello",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("RESEND_API_KEY");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("throws during production startup when email is misconfigured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;

    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => validateProductionEmailConfig()).toThrow(/RESEND_API_KEY/);
  });

  it("throws during production startup for placeholder API keys", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "re_xxxxxxxxx");
    vi.stubEnv("RESEND_FROM", "onboarding@resend.dev");

    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => validateProductionEmailConfig()).toThrow(/RESEND_API_KEY/);
  });

  it("warns but does not throw outside strict validation", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => warnProductionEmailConfig()).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("does not throw outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;

    expect(() => validateProductionEmailConfig()).not.toThrow();
  });
});
