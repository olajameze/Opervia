export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateProductionEmailConfig } = await import("@/lib/email");
    validateProductionEmailConfig();
  }
}
