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
    vi.stubEnv("RESEND_API_KEY", "key-a");
    getResend();
    expect(Resend).toHaveBeenCalledWith("key-a");
  });

  it("reuses the cached client when the API key is unchanged", () => {
    vi.stubEnv("RESEND_API_KEY", "key-a");
    const first = getResend();
    const second = getResend();
    expect(first).toBe(second);
    expect(Resend).toHaveBeenCalledTimes(1);
  });

  it("recreates the client when the API key changes", () => {
    vi.stubEnv("RESEND_API_KEY", "key-a");
    getResend();

    vi.stubEnv("RESEND_API_KEY", "key-b");
    getResend();

    expect(Resend).toHaveBeenCalledTimes(2);
    expect(Resend).toHaveBeenLastCalledWith("key-b");
  });

  it("resetResendClient clears the cache for test isolation", () => {
    vi.stubEnv("RESEND_API_KEY", "key-a");
    getResend();
    resetResendClient();
    getResend();
    expect(Resend).toHaveBeenCalledTimes(2);
  });
});
