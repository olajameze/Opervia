import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  getOrganizationOwners,
  notifyAccountDeleted,
} from "@/lib/account-emails";
import { Role } from "@prisma/client";

const schema = z.object({
  confirmName: z.string().min(2),
});

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== Role.OWNER) {
    return NextResponse.json(
      { error: "Only the workspace owner can delete this organization." },
      { status: 403 }
    );
  }

  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });

  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  let confirmName: string;
  try {
    confirmName = schema.parse(await req.json()).confirmName;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (confirmName.trim() !== organization.name) {
    return NextResponse.json(
      { error: "Organization name does not match. Deletion cancelled." },
      { status: 400 }
    );
  }

  const owners = await getOrganizationOwners(organization.id);

  if (organization.stripeSubscriptionId && isStripeConfigured()) {
    try {
      await getStripe().subscriptions.cancel(organization.stripeSubscriptionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stripe cancellation failed";
      console.error("[organization/delete] Stripe cancel failed:", message);
    }
  }

  await prisma.organization.delete({ where: { id: organization.id } });

  await notifyAccountDeleted({
    organizationName: organization.name,
    recipients: owners.length
      ? owners
      : [
          {
            email: session.user.email ?? "",
            name: session.user.name ?? session.user.email ?? "there",
          },
        ].filter((recipient) => recipient.email),
    idempotencyKey: `account-deleted/${organization.id}`,
  });

  return NextResponse.json({ ok: true });
}
