# Opervia Go-Live Checklist

Use this checklist before pointing real users at production.

Run automated checks locally or against staging:

```bash
npm run launch:check
npm run email:test-signup
```

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

Startup logs will warn about missing production variables via `lib/production-config.ts`.

## 2. Email (Resend)

1. Verify your sending domain in [Resend](https://resend.com/domains)
2. Set `RESEND_API_KEY` and `RESEND_FROM` (e.g. `Opervia <no-reply@yourdomain.com>`)
3. Set `OPERVIA_SIGNUP_NOTIFY_EMAIL=opervia@gmail.com` for new signup alerts
4. Smoke-test:
   - `npm run email:test` — basic Resend delivery
   - `npm run email:test-signup` — signup admin notification to opervia@gmail.com
   - Register → verify email → forgot password → contact form

## 3. Stripe (live mode)

See [STRIPE-SETUP.md](./STRIPE-SETUP.md).

Replace test keys with live keys, live price IDs, and register the webhook at:

`https://<your-domain>/api/stripe/webhook`

## 4. Bot protection

Set both Turnstile keys in production:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

Without both keys, public forms skip CAPTCHA verification.

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

## 7. Super admin security

1. Sign in as a super admin
2. Open `/super-admin/security`
3. Enable TOTP MFA before launch
4. Super admin MFA is enforced via a server-signed cookie (not client session state)

## 8. Workforce documents (Vercel Blob)

Staff and freelancer document uploads (CV, insurance, passport) use [Vercel Blob](https://vercel.com/docs/storage/vercel-blob).

1. In Vercel → **Storage → Create → Blob**, link a store to the Opervia project
2. Confirm `BLOB_READ_WRITE_TOKEN` is set on **Production** (Vercel injects this when the store is linked)
3. For local dev, copy the token into `.env`:
   ```bash
   npx vercel env pull .env.local
   ```
   Or run `npx vercel blob store add opervia-workforce` from the project root, then pull env vars
4. Restart `npm run dev` after updating `.env`
5. Smoke-test: Workforce → Edit staff → upload a PDF → confirm the document link opens

Without `BLOB_READ_WRITE_TOKEN`, uploads are disabled in the UI with a configuration notice.

## 9. Analytics

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` only after confirming cookie consent gating works.

Set `NEXT_PUBLIC_STRIPE_TEST_MODE=true` if you intentionally run test Stripe keys on a staging environment.

## 10. Never seed production

`npm run db:seed` is blocked in production. Demo credentials exist for local dev only.

## 11. Backups

See [BACKUPS.md](./BACKUPS.md). Enable Neon PITR before launch.

## 12. Smoke test

1. Register → verify email → onboarding → dashboard
2. Trial features → subscribe via Stripe Checkout
3. Billing Portal → update card → cancel
4. Cookie banner: Decline → no GA; Accept → GA loads
5. Settings → export workspace JSON → delete workspace (test org only)
6. Super admin → MFA → maintenance mode toggle
7. Confirm signup alert email arrives at opervia@gmail.com
8. Workforce → upload a staff document (requires Blob — see section 8)
