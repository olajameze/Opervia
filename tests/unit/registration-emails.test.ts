import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/app-url", () => ({
  getAppUrl: () => "https://opervia.com",
}));

import { sendEmail } from "@/lib/email";
import {
  getSignupNotifyEmail,
  sendNewSignupAdminNotification,
} from "@/lib/registration-emails";

describe("registration-emails", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.mocked(sendEmail).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  it("defaults signup notify email to opervia@gmail.com", () => {
    delete process.env.OPERVIA_SIGNUP_NOTIFY_EMAIL;
    delete process.env.RESEND_TEST_TO;
    delete process.env.OPERVIA_SUPPORT_EMAIL;

    expect(getSignupNotifyEmail()).toBe("opervia@gmail.com");
  });

  it("prefers OPERVIA_SIGNUP_NOTIFY_EMAIL when set", () => {
    process.env.OPERVIA_SIGNUP_NOTIFY_EMAIL = "alerts@example.com";
    expect(getSignupNotifyEmail()).toBe("alerts@example.com");
  });

  it("sends admin notification on new signup", async () => {
    process.env.OPERVIA_SIGNUP_NOTIFY_EMAIL = "opervia@gmail.com";

    await sendNewSignupAdminNotification({
      email: "newuser@example.com",
      name: "New User",
      method: "credentials",
    });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "opervia@gmail.com",
        subject: expect.stringContaining("New signup"),
        replyTo: "newuser@example.com",
        idempotencyKey: "signup-notify/newuser@example.com",
      })
    );
  });
});
