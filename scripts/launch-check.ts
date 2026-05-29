/**
 * Pre-launch validation: env vars, Stripe checklist, MFA status, smoke-test steps.
 *
 * Usage:
 *   npm run launch:check
 */
import { PrismaClient } from "@prisma/client";
import {
  getProductionLaunchChecklist,
  validateProductionLaunchConfig,
} from "../lib/production-config";
import { getStripeSetupChecklist } from "../lib/stripe-config";

const prisma = new PrismaClient();

function superAdminEmails(): string[] {
  return (
    process.env.SUPER_ADMIN_EMAILS?.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) ?? []
  );
}

function printSection(title: string) {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));
}

async function checkSuperAdminMfa() {
  const emails = superAdminEmails();
  if (emails.length === 0) {
    console.log("WARN  SUPER_ADMIN_EMAILS is empty — no platform admins configured");
    return;
  }

  const admins = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true, totpEnabledAt: true },
  });

  for (const email of emails) {
    const admin = admins.find((row) => row.email.toLowerCase() === email);
    if (!admin) {
      console.log(`WARN  Super admin ${email} has not registered yet`);
      continue;
    }
    if (!admin.totpEnabledAt) {
      console.log(`WARN  Super admin ${email} has not enabled MFA at /super-admin/security`);
    } else {
      console.log(`OK    Super admin ${email} has MFA enabled`);
    }
  }
}

async function main() {
  const checklist = getProductionLaunchChecklist();
  const stripe = getStripeSetupChecklist();

  printSection("Environment validation");
  const warnings = validateProductionLaunchConfig();
  if (warnings.length === 0) {
    console.log("OK    No production configuration warnings detected");
  } else {
    for (const warning of warnings) {
      console.log(`WARN  ${warning}`);
    }
  }

  printSection("Required environment variables");
  for (const key of checklist.requiredEnv) {
    const value = process.env[key]?.trim();
    console.log(`${value ? "OK   " : "MISS "} ${key}`);
  }

  printSection("Recommended environment variables");
  for (const key of checklist.recommendedEnv) {
    const value = process.env[key]?.trim();
    console.log(`${value ? "OK   " : "WARN "} ${key}`);
  }

  printSection("Stripe live setup");
  console.log(`Webhook URL: ${stripe.webhookUrl}`);
  for (const event of stripe.events) {
    console.log(`  - ${event}`);
  }
  for (const plan of stripe.plans) {
    const set = Boolean(process.env[plan.env]?.trim());
    console.log(`${set ? "OK   " : "MISS "} ${plan.env} (${plan.id} ${plan.amount})`);
  }

  printSection("Super admin MFA");
  try {
    await checkSuperAdminMfa();
  } catch (error) {
    console.log("WARN  Could not query database for MFA status (is DATABASE_URL set?)");
    console.log(String(error));
  }

  printSection("Manual launch steps");
  for (const step of checklist.manualSteps) {
    console.log(`- ${step}`);
  }

  printSection("GO-LIVE smoke test");
  const smokeSteps = [
    "Register → verify email → onboarding → dashboard",
    "Trial features → subscribe via Stripe Checkout",
    "Billing Portal → update card → cancel",
    "Cookie banner: Decline → no GA; Accept → GA loads",
    "Settings → export workspace JSON → delete workspace (test org only)",
    "Super admin → MFA → maintenance mode toggle",
  ];
  for (const step of smokeSteps) {
    console.log(`- ${step}`);
  }

  console.log("\nRun npm run email:test-signup to verify signup alerts reach opervia@gmail.com");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
