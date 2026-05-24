import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canBypassMaintenance,
  isMaintenanceExemptPath,
  isMaintenanceModeEnabled,
} from "@/lib/maintenance";

export async function enforceMaintenanceMode() {
  const pathname = headers().get("x-pathname") ?? "";
  if (isMaintenanceExemptPath(pathname)) return;

  if (!(await isMaintenanceModeEnabled())) return;

  const session = await auth();
  if (session?.user?.id && (await canBypassMaintenance(session.user.id))) return;

  redirect("/under-maintenance");
}
