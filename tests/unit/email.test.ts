import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getEmailConfigError,
  isEmailConfigured,
  sendEmail,
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
});
