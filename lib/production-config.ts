import { validateStripeProductionConfig } from "@/lib/stripe-config";

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";
}

function isUnset(value: string | undefined) {
  return !value?.trim();
}

function isPlaceholder(value: string | undefined, placeholders: string[]) {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return placeholders.some((placeholder) => trimmed === placeholder);
}

export function validateProductionLaunchConfig(): string[] {
  if (!isProductionRuntime()) return [];

  const warnings: string[] = [];

  const required = [
    "DATABASE_URL",
    "DIRECT_URL",
    "AUTH_SECRET",
    "AUTH_URL",
    "NEXT_PUBLIC_APP_URL",
    "RESEND_API_KEY",
    "RESEND_FROM",
    "SUPER_ADMIN_EMAILS",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_STARTER",
    "STRIPE_PRICE_PRO",
    "STRIPE_PRICE_ENTERPRISE",
    "LEGAL_ENTITY_NAME",
    "LEGAL_ENTITY_ADDRESS",
    "OPERVIA_SUPPORT_EMAIL",
  ] as const;

  for (const key of required) {
    if (isUnset(process.env[key])) {
      warnings.push(`${key} is not set`);
    }
  }

  if (isUnset(process.env.OPERVIA_SIGNUP_NOTIFY_EMAIL)) {
    warnings.push(
      "OPERVIA_SIGNUP_NOTIFY_EMAIL is not set (signup alerts will fall back to support email)"
    );
  }

  if (
    isUnset(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) ||
    isUnset(process.env.TURNSTILE_SECRET_KEY)
  ) {
    warnings.push("Turnstile keys are not set — bot protection is disabled on public forms");
  }

  if (
    isUnset(process.env.UPSTASH_REDIS_REST_URL) ||
    isUnset(process.env.UPSTASH_REDIS_REST_TOKEN)
  ) {
    warnings.push(
      "Upstash Redis is not configured — rate limits fall back to in-memory storage"
    );
  }

  if (isPlaceholder(process.env.RESEND_API_KEY, ["re_xxxxxxxxx"])) {
    warnings.push("RESEND_API_KEY is still a placeholder value");
  }

  if (isPlaceholder(process.env.DATABASE_URL, ["postgresql://user:password@localhost:5432/opervia?schema=public"])) {
    warnings.push("DATABASE_URL appears to be the local development placeholder");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const authUrl = process.env.AUTH_URL?.trim();
  if (appUrl && !appUrl.startsWith("https://")) {
    warnings.push("NEXT_PUBLIC_APP_URL should use HTTPS in production");
  }
  if (authUrl && !authUrl.startsWith("https://")) {
    warnings.push("AUTH_URL should use HTTPS in production");
  }
  if (appUrl && authUrl && appUrl !== authUrl) {
    warnings.push("NEXT_PUBLIC_APP_URL and AUTH_URL should match in production");
  }

  warnings.push(...validateStripeProductionConfig());

  return warnings;
}

export function getProductionLaunchChecklist() {
  return {
    requiredEnv: [
      "DATABASE_URL",
      "DIRECT_URL",
      "AUTH_SECRET",
      "AUTH_URL",
      "NEXT_PUBLIC_APP_URL",
      "RESEND_API_KEY",
      "RESEND_FROM",
      "OPERVIA_SIGNUP_NOTIFY_EMAIL",
      "SUPER_ADMIN_EMAILS",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PRICE_STARTER",
      "STRIPE_PRICE_PRO",
      "STRIPE_PRICE_ENTERPRISE",
      "LEGAL_ENTITY_NAME",
      "LEGAL_ENTITY_ADDRESS",
      "OPERVIA_SUPPORT_EMAIL",
    ],
    recommendedEnv: [
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "TURNSTILE_SECRET_KEY",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
      "BLOB_READ_WRITE_TOKEN",
      "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    ],
    manualSteps: [
      "Verify sending domain in Resend and set RESEND_FROM",
      "Register live Stripe webhook at /api/stripe/webhook",
      "Enable Stripe Customer Portal for plan management",
      "Enable super-admin TOTP MFA at /super-admin/security",
      "Solicitor review of /terms, /privacy, and /security",
      "Enable Neon PITR and document restore procedure (docs/BACKUPS.md)",
      "Run npm run launch:check and npm run email:test-signup against production/staging",
      "Complete GO-LIVE smoke test (docs/GO-LIVE.md section 10)",
    ],
  };
}
