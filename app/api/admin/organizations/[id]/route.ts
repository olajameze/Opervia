import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSuperAdminApi } from "@/lib/super-admin";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

const schema = z.object({
  action: z.enum(["freeze", "unfreeze", "cancel_plan"]),
});

async function cancelStripeSubscription(subscriptionId: string | null) {
  if (!subscriptionId) return { canceled: false, reason: "no_subscription" };
  if (!isStripeConfigured()) {
    return { canceled: false, reason: "stripe_not_configured" };
  }
  try {
    await getStripe().subscriptions.cancel(subscriptionId);
    return { canceled: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Stripe error";
    return { canceled: false, reason: "stripe_error", message };
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireSuperAdminApi();
  if ("error" in ctx) return ctx.error;

  try {
    const body = schema.parse(await req.json());
    const org = await prisma.organization.findUnique({
      where: { id: params.id },
    });
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (body.action === "freeze") {
      const updated = await prisma.organization.update({
        where: { id: params.id },
        data: { frozenAt: new Date() },
      });
      return NextResponse.json(updated);
    }

    if (body.action === "unfreeze") {
      const updated = await prisma.organization.update({
        where: { id: params.id },
        data: { frozenAt: null },
      });
      return NextResponse.json(updated);
    }

    const stripeResult = await cancelStripeSubscription(
      org.stripeSubscriptionId
    );

    const updated = await prisma.organization.update({
      where: { id: params.id },
      data: {
        subscriptionStatus: "CANCELED",
        subscriptionPlan: null,
        stripeSubscriptionId: null,
      },
    });

    return NextResponse.json({ ...updated, stripe: stripeResult });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireSuperAdminApi();
  if ("error" in ctx) return ctx.error;

  const org = await prisma.organization.findUnique({
    where: { id: params.id },
  });
  if (!org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  const stripeResult = await cancelStripeSubscription(org.stripeSubscriptionId);

  await prisma.organization.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true, stripe: stripeResult });
}
