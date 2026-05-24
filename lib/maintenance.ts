import { NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/system-settings";
import { isSuperAdminUser } from "@/lib/super-admin";
import {
  isMaintenanceExemptApi,
  isMaintenanceExemptPage,
  isMaintenanceExemptPath,
  MAINTENANCE_EXEMPT_API_PREFIXES,
  MAINTENANCE_EXEMPT_PAGE_PREFIXES,
} from "@/lib/maintenance-paths";

export type MaintenanceState = {
  enabled: boolean;
  message: string | null;
};

export {
  isMaintenanceExemptApi,
  isMaintenanceExemptPage,
  isMaintenanceExemptPath,
  MAINTENANCE_EXEMPT_API_PREFIXES,
  MAINTENANCE_EXEMPT_PAGE_PREFIXES,
};

export async function getMaintenanceState(): Promise<MaintenanceState> {
  try {
    const settings = await getSystemSettings();
    return {
      enabled: settings.maintenanceMode,
      message: settings.maintenanceMessage,
    };
  } catch {
    return { enabled: false, message: null };
  }
}

export async function isMaintenanceModeEnabled(): Promise<boolean> {
  const { enabled } = await getMaintenanceState();
  return enabled;
}

export async function canBypassMaintenance(userId: string): Promise<boolean> {
  return isSuperAdminUser(userId);
}

export async function canSignInDuringMaintenance(userId: string): Promise<boolean> {
  if (!(await isMaintenanceModeEnabled())) return true;
  return canBypassMaintenance(userId);
}

export function maintenanceModeResponse() {
  return NextResponse.json(
    {
      error: "Opervia is under maintenance. Please try again later.",
      code: "MAINTENANCE",
    },
    { status: 503 }
  );
}

/** Returns a 503 response during maintenance, or null when the request may proceed. */
export async function guardPublicAccessDuringMaintenance(): Promise<NextResponse | null> {
  if (!(await isMaintenanceModeEnabled())) return null;
  return maintenanceModeResponse();
}
