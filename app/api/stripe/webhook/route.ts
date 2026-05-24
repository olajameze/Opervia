import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { planFromStripePriceId } from "@/lib/plans";
import type Stripe from "stripe";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

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

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    trialing: "TRIALING",
    unpaid: "UNPAID",
    incomplete: "UNPAID",
    incomplete_expired: "CANCELED",
    paused: "PAST_DUE",
  };
  return statusMap[status] ?? "ACTIVE";
}

function trialEndsAtFromSubscription(sub: Stripe.Subscription): Date | null {
  if (!sub.trial_end) return null;
  return new Date(sub.trial_end * 1000);
}

async function syncOrganizationFromSubscription(sub: Stripe.Subscription) {
  const org = await prisma.organization.findFirst({
    where: { stripeSubscriptionId: sub.id },
  });
  if (!org) return;

  const priceId = sub.items.data[0]?.price.id;
  const plan = resolvePlan(sub.metadata?.plan, priceId);
  const mappedStatus = mapStripeSubscriptionStatus(sub.status);
  const trialEndsAt = trialEndsAtFromSubscription(sub);

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      subscriptionStatus: mappedStatus,
      ...(plan ? { subscriptionPlan: plan } : {}),
      ...(trialEndsAt ? { trialEndsAt } : mappedStatus === "ACTIVE" ? { trialEndsAt: null } : {}),
    },
  });
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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organizationId;
        const plan = resolvePlan(session.metadata?.plan, undefined);
        if (orgId && session.customer && session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
          await prisma.organization.update({
            where: { id: orgId },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: sub.id,
              subscriptionStatus: mapStripeSubscriptionStatus(sub.status),
              ...(plan ? { subscriptionPlan: plan } : {}),
              trialEndsAt: trialEndsAtFromSubscription(sub),
            },
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        if (event.type === "customer.subscription.deleted") {
          await prisma.organization.updateMany({
            where: { stripeSubscriptionId: sub.id },
            data: {
              subscriptionStatus: "CANCELED",
              subscriptionPlan: null,
              stripeSubscriptionId: null,
            },
          });
        } else {
          await syncOrganizationFromSubscription(sub);
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;
        if (subscriptionId) {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          await syncOrganizationFromSubscription(sub);
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;
        if (subscriptionId) {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          await syncOrganizationFromSubscription(sub);
        }
        break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed";
    console.error("[stripe/webhook]", event.type, message);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
