import { describe, it, expect, beforeEach, vi } from "vitest";
import { Resend } from "resend";
import { getResend, resetResendClient } from "@/lib/resend-client";

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation((apiKey: string) => ({ apiKey })),
}));

describe("getResend", () => {
  beforeEach(() => {
    resetResendClient();
    vi.clearAllMocks();
  });

  it("creates a client with the current API key", () => {
    vi.stubEnv("RESEND_API_KEY", "re_validkey123");
    getResend();
    expect(Resend).toHaveBeenCalledWith("re_validkey123");
  });

  it("reuses the cached client when the API key is unchanged", () => {
    vi.stubEnv("RESEND_API_KEY", "re_validkey123");
    const first = getResend();
    const second = getResend();
    expect(first).toBe(second);
    expect(Resend).toHaveBeenCalledTimes(1);
  });

  it("recreates the client when the API key changes", () => {
    vi.stubEnv("RESEND_API_KEY", "re_validkey123");
    getResend();

    vi.stubEnv("RESEND_API_KEY", "re_validkey456");
    getResend();

    expect(Resend).toHaveBeenCalledTimes(2);
    expect(Resend).toHaveBeenLastCalledWith("re_validkey456");
  });

  it("resetResendClient clears the cache for test isolation", () => {
    vi.stubEnv("RESEND_API_KEY", "re_validkey123");
    getResend();
    resetResendClient();
    getResend();
    expect(Resend).toHaveBeenCalledTimes(2);
  });

  it("rejects placeholder API keys", () => {
    vi.stubEnv("RESEND_API_KEY", "re_xxxxxxxxx");
    expect(() => getResend()).toThrow(/RESEND_API_KEY is not set/);
  });
});
