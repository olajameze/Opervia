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

export function isReservedSuperAdminEmail(email: string): boolean {
  return superAdminEmails().includes(email.trim().toLowerCase());
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

type SuperAdminGuardOptions = {
  skipMfa?: boolean;
};

function requiresSuperAdminMfa(session: {
  user: { totpEnabled?: boolean; superAdminMfaVerified?: boolean };
}) {
  return Boolean(session.user.totpEnabled && !session.user.superAdminMfaVerified);
}

export async function requireSuperAdmin(options?: SuperAdminGuardOptions) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/super-admin");
  if (!(await isSuperAdminUser(session.user.id))) redirect("/dashboard");

  if (!options?.skipMfa && requiresSuperAdminMfa(session)) {
    redirect("/super-admin/mfa");
  }

  return session;
}

export async function requireSuperAdminApi(options?: SuperAdminGuardOptions) {
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

  if (!options?.skipMfa && requiresSuperAdminMfa(session)) {
    return {
      error: NextResponse.json(
        { error: "MFA verification required", code: "MFA_REQUIRED" },
        { status: 403 }
      ),
    };
  }

  return { session, userId: session.user.id };
}

export function isSuperAdminMfaExemptPath(pathname: string): boolean {
  return (
    pathname === "/super-admin/mfa" ||
    pathname.startsWith("/super-admin/security") ||
    pathname.startsWith("/api/admin/mfa")
  );
}

export {
  isMaintenanceExemptPath,
  MAINTENANCE_EXEMPT_PAGE_PREFIXES as MAINTENANCE_EXEMPT_PREFIXES,
} from "@/lib/maintenance-paths";
