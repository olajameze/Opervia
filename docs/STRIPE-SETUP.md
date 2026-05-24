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

## 5. End-to-end test

Use Stripe test mode locally first (`sk_test_...`), then repeat with live keys on a staging domain before production launch.

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Verify:

1. Checkout completes and org status becomes `ACTIVE`
2. Failed payment sets `PAST_DUE` but billing portal remains accessible
3. Cancellation sets `CANCELED`
