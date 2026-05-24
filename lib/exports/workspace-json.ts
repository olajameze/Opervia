import { prisma } from "@/lib/db";

export async function buildWorkspaceExport(organizationId: string) {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  const [
    memberships,
    staffProfiles,
    freelancerProfiles,
    clients,
    projects,
    jobs,
    equipment,
    invoices,
    payments,
    shifts,
    assignments,
    logisticsRecords,
    workflowRules,
  ] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    }),
    prisma.staffProfile.findMany({ where: { organizationId } }),
    prisma.freelancerProfile.findMany({ where: { organizationId } }),
    prisma.client.findMany({ where: { organizationId } }),
    prisma.project.findMany({ where: { organizationId } }),
    prisma.job.findMany({ where: { organizationId } }),
    prisma.equipment.findMany({ where: { organizationId } }),
    prisma.invoice.findMany({ where: { organizationId } }),
    prisma.payment.findMany({ where: { organizationId } }),
    prisma.shift.findMany({ where: { organizationId } }),
    prisma.assignment.findMany({ where: { organizationId } }),
    prisma.logisticsEvent.findMany({ where: { organizationId } }),
    prisma.workflowRule.findMany({ where: { organizationId } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      subscriptionStatus: organization.subscriptionStatus,
      subscriptionPlan: organization.subscriptionPlan,
      trialEndsAt: organization.trialEndsAt,
      createdAt: organization.createdAt,
    },
    memberships: memberships.map((m) => ({
      role: m.role,
      joinedAt: m.createdAt,
      user: m.user,
    })),
    staffProfiles,
    freelancerProfiles,
    clients,
    projects,
    jobs,
    equipment,
    invoices,
    payments,
    shifts,
    assignments,
    logisticsRecords,
    workflowRules,
  };
}
