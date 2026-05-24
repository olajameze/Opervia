# Opervia Go-Live Checklist

Use this checklist before pointing real users at production.

## 1. Domain and environment (Vercel Production)

Set these on **Production** (not Preview):

| Variable | Example |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://opervia.com` |
| `AUTH_URL` | `https://opervia.com` |
| `AUTH_SECRET` | 32+ byte random string |
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon unpooled connection string |
| `SUPER_ADMIN_EMAILS` | Your admin email(s) |

Add your custom domain in Vercel → Project → Settings → Domains.

## 2. Email (Resend)

1. Verify your sending domain in [Resend](https://resend.com/domains)
2. Set `RESEND_API_KEY` and `RESEND_FROM` (e.g. `Opervia <no-reply@yourdomain.com>`)
3. Set `OPERVIA_SIGNUP_NOTIFY_EMAIL` for new signup alerts
4. Smoke-test: register → verify email → forgot password → contact form

## 3. Stripe (live mode)

See [STRIPE-SETUP.md](./STRIPE-SETUP.md).

## 4. Bot protection

Set both Turnstile keys in production:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## 5. Rate limiting (recommended at scale)

Create an [Upstash Redis](https://upstash.com/) database and set:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Without these, rate limits fall back to in-memory (weaker on serverless).

## 6. Legal identity

Set on Production:

- `LEGAL_ENTITY_NAME`
- `LEGAL_ENTITY_ADDRESS`
- `OPERVIA_SUPPORT_EMAIL` / `OPERVIA_SALES_EMAIL`

Have a solicitor review `/terms`, `/privacy`, and `/security`.

## 7. Analytics

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` only after confirming cookie consent gating works.

Set `NEXT_PUBLIC_STRIPE_TEST_MODE=true` if you intentionally run test Stripe keys on a staging environment.

## 8. Never seed production

`npm run db:seed` is blocked in production. Demo credentials exist for local dev only.

## 9. Backups

See [BACKUPS.md](./BACKUPS.md).

## 10. Smoke test

1. Register → verify email → onboarding → dashboard
2. Trial features → subscribe via Stripe Checkout
3. Billing Portal → update card → cancel
4. Cookie banner: Decline → no GA; Accept → GA loads
5. Settings → export workspace JSON → delete workspace (test org only)
6. Super admin → MFA → maintenance mode toggle
