import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";
import { canAccessModule, type AppModule } from "@/lib/entitlements";

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
  if (!session.user.organizationId) redirect("/onboarding");
  return session;
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

export async function requireModuleAccess(module: AppModule) {
  const { organization } = await getOrganizationContext();
  if (!canAccessModule(organization, module)) {
    redirect("/billing?upgrade=true");
  }
  return { organization };
}

export function hasRole(userRole: Role | undefined, allowed: Role[]) {
  if (!userRole) return false;
  return allowed.includes(userRole);
}
