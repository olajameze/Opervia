import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    membership: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  notifyAccountDeleted,
  notifyOrganizationOwnersSubscriptionCanceled,
} from "@/lib/account-emails";

describe("account-emails", () => {
  beforeEach(() => {
    vi.mocked(sendEmail).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("emails owners when a subscription is canceled", async () => {
    vi.mocked(prisma.membership.findMany).mockResolvedValue([
      {
        user: { email: "owner@example.com", name: "Owner" },
      },
    ] as never);

    await notifyOrganizationOwnersSubscriptionCanceled({
      organizationId: "org_1",
      organizationName: "Acme Rentals",
      plan: "PRO",
      idempotencyKey: "subscription-canceled/sub_123",
    });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
        subject: expect.stringContaining("subscription canceled"),
        idempotencyKey: "subscription-canceled/sub_123/owner@example.com",
      })
    );
  });

  it("emails recipients when an account is deleted", async () => {
    await notifyAccountDeleted({
      organizationName: "Acme Rentals",
      recipients: [{ email: "owner@example.com", name: "Owner" }],
      idempotencyKey: "account-deleted/org_1",
    });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
        subject: expect.stringContaining("account deleted"),
        idempotencyKey: "account-deleted/org_1/owner@example.com",
      })
    );
  });
});
