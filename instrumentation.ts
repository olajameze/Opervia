export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { warnProductionEmailConfig } = await import("@/lib/email");
    const { validateProductionLaunchConfig } = await import("@/lib/production-config");
    warnProductionEmailConfig();

    for (const warning of validateProductionLaunchConfig()) {
      console.error(`[Opervia] Production launch warning: ${warning}`);
    }
  }
}
