import { describe, it, expect } from "vitest";
import { generateSync } from "otplib";
import { generateTotpSecret, verifyTotpCode } from "@/lib/mfa/totp";

describe("mfa totp", () => {
  it("generates and verifies a valid code", () => {
    const secret = generateTotpSecret();
    const token = generateSync({ secret });
    expect(verifyTotpCode(secret, token)).toBe(true);
  });

  it("rejects invalid codes", () => {
    const secret = generateTotpSecret();
    expect(verifyTotpCode(secret, "000000")).toBe(false);
  });
});
