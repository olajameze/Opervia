export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { warnProductionEmailConfig } = await import("@/lib/email");
    warnProductionEmailConfig();
  }
}
