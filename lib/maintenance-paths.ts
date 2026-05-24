import { NextResponse } from "next/server";

/** Pages reachable while maintenance mode is on (super-admin sign-in, consoles). */
export const MAINTENANCE_EXEMPT_PAGE_PREFIXES = [
  "/under-maintenance",
  "/account-suspended",
  "/super-admin",
  "/maintenance",
  "/login",
] as const;

/** API routes that stay available during maintenance. Auth is allowed; sign-in is gated in auth.ts. */
export const MAINTENANCE_EXEMPT_API_PREFIXES = [
  "/api/auth",
  "/api/admin",
  "/api/stripe/webhook",
  "/api/system/maintenance",
] as const;

export function isMaintenanceExemptPage(pathname: string): boolean {
  return MAINTENANCE_EXEMPT_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isMaintenanceExemptApi(pathname: string): boolean {
  return MAINTENANCE_EXEMPT_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isMaintenanceExemptPath(pathname: string): boolean {
  if (pathname.startsWith("/api/")) {
    return isMaintenanceExemptApi(pathname);
  }
  return isMaintenanceExemptPage(pathname);
}

export function maintenanceModeJsonResponse() {
  return NextResponse.json(
    {
      error: "Opervia is under maintenance. Please try again later.",
      code: "MAINTENANCE",
    },
    { status: 503 }
  );
}
