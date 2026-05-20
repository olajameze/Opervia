import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSystemSettings } from "@/lib/system-settings";
import { isMaintenanceExemptPath, isSuperAdminUser } from "@/lib/super-admin";

export async function enforceMaintenanceMode() {
  const pathname = headers().get("x-pathname") ?? "";
  if (isMaintenanceExemptPath(pathname)) return;

  let maintenanceMode = false;
  try {
    const settings = await getSystemSettings();
    maintenanceMode = settings.maintenanceMode;
  } catch (error) {
    // Database unreachable — skip enforcement so public pages still render.
    // App routes that need the DB will fail naturally with their own error.
    console.warn(
      "[maintenance] Could not read system settings, skipping enforcement:",
      error instanceof Error ? error.message : error
    );
    return;
  }

  if (!maintenanceMode) return;

  try {
    const session = await auth();
    if (session?.user?.id && (await isSuperAdminUser(session.user.id))) return;
  } catch {
    // If we can't check super admin status due to DB issues, fall through
    // and redirect to the maintenance page rather than serving the app.
  }

  redirect("/under-maintenance");
}
