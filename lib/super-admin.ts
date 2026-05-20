import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export function superAdminEmails(): string[] {
  return (
    process.env.SUPER_ADMIN_EMAILS?.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) ?? []
  );
}

export async function isSuperAdminUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true, email: true },
  });

  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return superAdminEmails().includes(user.email.toLowerCase());
}

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/super-admin");
  if (!(await isSuperAdminUser(session.user.id))) redirect("/dashboard");
  return session;
}

export async function requireSuperAdminApi() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!(await isSuperAdminUser(session.user.id))) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, userId: session.user.id };
}

export const MAINTENANCE_EXEMPT_PREFIXES = [
  "/under-maintenance",
  "/account-suspended",
  "/super-admin",
  "/maintenance",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/admin",
  "/api/stripe/webhook",
];

export function isMaintenanceExemptPath(pathname: string): boolean {
  return MAINTENANCE_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
