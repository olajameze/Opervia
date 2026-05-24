export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { warnProductionEmailConfig } = await import("@/lib/email");
    const { validateStripeProductionConfig } = await import("@/lib/stripe-config");
    warnProductionEmailConfig();

    for (const warning of validateStripeProductionConfig()) {
      console.error(`[Opervia] Stripe production warning: ${warning}`);
    }
  }
}
