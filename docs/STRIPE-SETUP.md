# Stripe Production Setup

## 1. Create live products and prices

In the [Stripe Dashboard](https://dashboard.stripe.com/products) (live mode), create three recurring GBP prices:

| Plan | Amount | Env variable |
|---|---|---|
| Starter | £99/month | `STRIPE_PRICE_STARTER` |
| Pro | £199/month | `STRIPE_PRICE_PRO` |
| Enterprise | £399/month | `STRIPE_PRICE_ENTERPRISE` |

## 2. API keys (Production env on Vercel)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Optional banner for non-production test mode:

```
NEXT_PUBLIC_STRIPE_TEST_MODE=true
```

## 3. Webhook endpoint

Register a webhook in Stripe Dashboard → Developers → Webhooks:

**URL:** `https://<your-domain>/api/stripe/webhook`

**Events to subscribe:**

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.paid`

Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.

## 4. Customer Portal

Stripe Dashboard → Settings → Billing → Customer portal:

- Enable payment method updates
- Enable subscription cancellation
- Enable invoice history
- Link your three products/prices

## 5. Free trial at Checkout

New workspaces **must** complete Stripe Checkout during onboarding:

1. User picks Starter, Pro, or Enterprise on `/onboarding`.
2. Checkout creates a Stripe subscription with `trial_period_days: 30` (from `BRAND.trialDays`).
3. Stripe collects a payment method upfront; **no charge** until the trial ends.
4. Webhook `checkout.session.completed` stores `stripeCustomerId`, `stripeSubscriptionId`, and sets org status to `TRIALING`.
5. When the trial ends, Stripe creates an invoice and charges automatically.
6. Webhook `invoice.paid` sets org status to `ACTIVE`.

Re-subscribes from `/billing` after cancel or expiry **do not** receive a second trial — Checkout charges immediately.

Local dev without `STRIPE_SECRET_KEY` skips Checkout and uses the app-only trial fallback.

## 6. End-to-end test

Use Stripe test mode locally first (`sk_test_...`), then repeat with live keys on a staging domain before production launch.

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Verify:

1. Onboarding → Checkout → subscription status `trialing` in Stripe Dashboard
2. Org in DB: `TRIALING`, `trialEndsAt` ≈ 30 days out, chosen `subscriptionPlan`
3. Dashboard blocked until Checkout completes; abandoned Checkout returns to `/onboarding`
4. After trial (use [Stripe test clocks](https://docs.stripe.com/billing/testing/test-clocks) or a short trial in dev): first invoice succeeds → org `ACTIVE`
5. Failed payment after trial sets `PAST_DUE` but billing portal remains accessible
6. Cancellation sets `CANCELED`
