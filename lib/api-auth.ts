import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canAccessModule, hasActiveSubscription } from "@/lib/entitlements";
import type { AppModule } from "@/lib/plans";
import {
  getStaffLimit,
  getFreelancerLimit,
  getStaffUpgradeMessage,
  getFreelancerUpgradeMessage,
} from "@/lib/plans";

export async function requireApiOrganization(module?: AppModule) {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { frozenAt: true },
  });

  if (user?.frozenAt) {
    return {
      error: NextResponse.json({ error: "Account suspended" }, { status: 403 }),
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

  if (organization.frozenAt) {
    return {
      error: NextResponse.json({ error: "Organization suspended" }, { status: 403 }),
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

export async function assertStaffCapacity(organizationId: string) {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  const limit = getStaffLimit(organization);
  const staffCount = await prisma.staffProfile.count({ where: { organizationId } });

  if (staffCount >= limit) {
    return NextResponse.json(
      {
        error: `Staff limit reached (${limit}). ${getStaffUpgradeMessage(organization)}`,
      },
      { status: 403 }
    );
  }

  return null;
}

export async function assertFreelancerCapacity(organizationId: string) {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  const limit = getFreelancerLimit(organization);
  const freelancerCount = await prisma.freelancerProfile.count({
    where: { organizationId },
  });

  if (freelancerCount >= limit) {
    return NextResponse.json(
      {
        error: `Freelancer limit reached (${limit}). ${getFreelancerUpgradeMessage(organization)}`,
      },
      { status: 403 }
    );
  }

  return null;
}

/** @deprecated Use assertStaffCapacity or assertFreelancerCapacity */
export async function assertTeamMemberCapacity(organizationId: string) {
  return assertStaffCapacity(organizationId);
}

export async function assertMembershipCapacity(organizationId: string) {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  const limit = getStaffLimit(organization);
  const memberCount = await prisma.membership.count({ where: { organizationId } });

  if (memberCount >= limit) {
    return NextResponse.json(
      {
        error: `Login seat limit reached (${limit}). ${getStaffUpgradeMessage(organization)}`,
      },
      { status: 403 }
    );
  }

  return null;
}
