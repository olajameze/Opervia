import { describe, it, expect, beforeEach } from "vitest";
import { isDisposableEmail } from "@/lib/security/disposable-email";
import { isHoneypotTriggered, HONEYPOT_FIELD } from "@/lib/security/honeypot";
import { validatePassword } from "@/lib/security/password";
import { checkRateLimit, resetRateLimits } from "@/lib/security/rate-limit";

describe("security", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("blocks disposable email domains", () => {
    expect(isDisposableEmail("bot@mailinator.com")).toBe(true);
    expect(isDisposableEmail("user@company.com")).toBe(false);
  });

  it("detects honeypot submissions", () => {
    expect(isHoneypotTriggered("")).toBe(false);
    expect(isHoneypotTriggered(undefined)).toBe(false);
    expect(isHoneypotTriggered("https://spam.example")).toBe(true);
    expect(HONEYPOT_FIELD).toBe("_website");
  });

  it("enforces password complexity rules", () => {
    expect(validatePassword("short1")).toMatch(/at least 8/);
    expect(validatePassword("allletters")).toMatch(/number/);
    expect(validatePassword("12345678")).toMatch(/letter/);
    expect(validatePassword("password123")).toMatch(/too common/);
    expect(validatePassword("Opervia2026")).toBeNull();
  });

  it("rate limits repeated requests", () => {
    const key = "test:ip:1.2.3.4";
    expect(checkRateLimit(key, 2, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).ok).toBe(true);
    const blocked = checkRateLimit(key, 2, 60_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });
});
