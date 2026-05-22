import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Organization, Role } from "@prisma/client";
import {
  canAccessModule,
  hasActiveSubscription,
  INACTIVE_SUBSCRIPTION_PATHS,
  type AppModule,
} from "@/lib/entitlements";
import { canRoleAccessModule } from "@/lib/roles";
import { normalizeInviteEmail } from "@/lib/invites";

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireOrganization() {
  const session = await requireAuth();
  if (session.user.organizationId) return session;

  // JWT can lag right after onboarding — resolve membership from the database.
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    const pendingInvite = session.user.email
      ? await prisma.teamInvite.findFirst({
          where: {
            email: normalizeInviteEmail(session.user.email),
            acceptedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        })
      : null;

    if (pendingInvite) redirect(`/invite?token=${pendingInvite.token}`);
    redirect("/onboarding");
  }

  return {
    ...session,
    user: {
      ...session.user,
      organizationId: membership.organizationId,
      role: membership.role,
      organizationName: membership.organization.name,
    },
  };
}

export async function getOrganizationContext() {
  const session = await requireOrganization();
  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organizationId! },
  });
  if (!organization) redirect("/onboarding");
  if (organization.frozenAt) redirect("/account-suspended");
  return { session, organization };
}

/** Redirect to billing when subscription is inactive and the route is not allowed. */
export function enforceSubscriptionAccess(
  organization: Pick<Organization, "subscriptionStatus" | "trialEndsAt">
) {
  if (hasActiveSubscription(organization)) return;

  const pathname = headers().get("x-pathname") ?? "";
  const allowed = INACTIVE_SUBSCRIPTION_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!allowed) {
    redirect("/billing?expired=1");
  }
}

export async function requireModuleAccess(module: AppModule) {
  const { session, organization } = await getOrganizationContext();

  if (!canRoleAccessModule(session.user.role, module)) {
    redirect("/dashboard?access=denied");
  }

  if (!canAccessModule(organization, module)) {
    if (!hasActiveSubscription(organization)) {
      redirect("/billing?expired=1");
    }
    redirect("/billing?upgrade=true");
  }
  return { session, organization };
}

export function hasRole(userRole: Role | undefined, allowed: Role[]) {
  if (!userRole) return false;
  return allowed.includes(userRole);
}
