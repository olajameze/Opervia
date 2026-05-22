import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { planFromStripePriceId } from "@/lib/plans";
import type Stripe from "stripe";
import type { SubscriptionPlan } from "@prisma/client";

function resolvePlan(
  metadataPlan: string | undefined,
  priceId: string | undefined
): SubscriptionPlan | undefined {
  if (metadataPlan === "STARTER" || metadataPlan === "PRO" || metadataPlan === "ENTERPRISE") {
    return metadataPlan;
  }
  if (priceId) {
    return planFromStripePriceId(priceId) ?? undefined;
  }
  return undefined;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organizationId;
      const plan = resolvePlan(session.metadata?.plan, undefined);
      if (orgId && session.customer) {
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            subscriptionStatus: "ACTIVE",
            ...(plan ? { subscriptionPlan: plan } : {}),
          },
        });
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const org = await prisma.organization.findFirst({
        where: { stripeSubscriptionId: sub.id },
      });
      if (org) {
        const statusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING"> = {
          active: "ACTIVE",
          past_due: "PAST_DUE",
          canceled: "CANCELED",
          trialing: "TRIALING",
        };
        const priceId = sub.items.data[0]?.price.id;
        const plan = resolvePlan(sub.metadata?.plan, priceId);
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            subscriptionStatus: statusMap[sub.status] ?? "ACTIVE",
            ...(plan ? { subscriptionPlan: plan } : {}),
          },
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.organization.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { subscriptionStatus: "CANCELED", subscriptionPlan: null },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
