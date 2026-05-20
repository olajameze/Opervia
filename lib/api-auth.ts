import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canAccessModule, hasActiveSubscription } from "@/lib/entitlements";
import type { AppModule } from "@/lib/plans";

export async function requireApiOrganization(module?: AppModule) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });

  if (!organization) {
    return {
      error: NextResponse.json({ error: "Organization not found" }, { status: 404 }),
    };
  }

  if (module && !canAccessModule(organization, module)) {
    return {
      error: NextResponse.json(
        { error: "Upgrade required for this feature" },
        { status: 403 }
      ),
    };
  }

  if (!hasActiveSubscription(organization)) {
    return {
      error: NextResponse.json(
        { error: "Subscription inactive. Update billing to continue." },
        { status: 402 }
      ),
    };
  }

  return { session, organization, organizationId: organization.id };
}

export async function assertTeamMemberCapacity(organizationId: string) {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  const { getTeamMemberLimit } = await import("@/lib/entitlements");
  const limit = getTeamMemberLimit(organization);

  if (limit === null) return null;

  const [staffCount, freelancerCount] = await Promise.all([
    prisma.staffProfile.count({ where: { organizationId } }),
    prisma.freelancerProfile.count({ where: { organizationId } }),
  ]);

  if (staffCount + freelancerCount >= limit) {
    return NextResponse.json(
      { error: `Team member limit reached (${limit}). Upgrade to Pro for unlimited team members.` },
      { status: 403 }
    );
  }

  return null;
}
