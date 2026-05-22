import { describe, it, expect, afterEach } from "vitest";
import { getAppUrl } from "@/lib/app-url";

describe("getAppUrl", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses configured NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.opervia.com/";
    expect(getAppUrl()).toBe("https://app.opervia.com");
  });

  it("falls back when NEXT_PUBLIC_APP_URL is empty", () => {
    process.env.NEXT_PUBLIC_APP_URL = "";
    process.env.VERCEL_URL = "opervia-two.vercel.app";
    process.env.NODE_ENV = "production";
    expect(getAppUrl()).toBe("https://opervia-two.vercel.app");
  });

  it("uses localhost in development when unset", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    process.env.NODE_ENV = "development";
    expect(getAppUrl()).toBe("http://localhost:3000");
  });
});
