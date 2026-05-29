import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  SUPER_ADMIN_MFA_COOKIE,
  SUPER_ADMIN_MFA_TTL_SEC,
  createSuperAdminMfaCookieValue,
  verifySuperAdminMfaCookieValue,
  superAdminMfaCookieOptions,
} from "@/lib/mfa/super-admin-mfa-cookie";

describe("super-admin MFA cookie", () => {
  const originalSecret = process.env.AUTH_SECRET;

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-for-mfa-cookie-signing-32b";
  });

  afterEach(() => {
    process.env.AUTH_SECRET = originalSecret;
  });

  it("creates and verifies a signed cookie for the same user", async () => {
    const value = await createSuperAdminMfaCookieValue("user_123");
    expect(value).toBeTruthy();

    const valid = await verifySuperAdminMfaCookieValue("user_123", value);
    expect(valid).toBe(true);
  });

  it("rejects cookies for a different user", async () => {
    const value = await createSuperAdminMfaCookieValue("user_123");
    const valid = await verifySuperAdminMfaCookieValue("user_other", value);
    expect(valid).toBe(false);
  });

  it("rejects tampered cookies", async () => {
    const value = await createSuperAdminMfaCookieValue("user_123");
    const tampered = `${value}x`;
    const valid = await verifySuperAdminMfaCookieValue("user_123", tampered);
    expect(valid).toBe(false);
  });

  it("rejects expired cookies", async () => {
    const value = await createSuperAdminMfaCookieValue("user_123");
    expect(value).toBeTruthy();

    const futureSpy = vi.spyOn(Date, "now").mockReturnValue(
      Date.now() + (SUPER_ADMIN_MFA_TTL_SEC + 60) * 1000
    );

    const valid = await verifySuperAdminMfaCookieValue("user_123", value);
    expect(valid).toBe(false);

    futureSpy.mockRestore();
  });

  it("uses secure httpOnly cookie defaults", () => {
    const options = superAdminMfaCookieOptions();
    expect(options.name).toBe(SUPER_ADMIN_MFA_COOKIE);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.maxAge).toBe(SUPER_ADMIN_MFA_TTL_SEC);
  });
});
