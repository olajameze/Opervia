import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

export async function createOrganization(
  userId: string,
  name: string,
  slug: string
) {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 5);

  const organization = await prisma.organization.create({
    data: {
      name,
      slug,
      trialEndsAt,
      subscriptionStatus: "TRIALING",
      memberships: {
        create: {
          userId,
          role: Role.OWNER,
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "organization.created",
      entity: "Organization",
      entityId: organization.id,
      userId,
      organizationId: organization.id,
      metadata: { name, slug } as object,
    },
  });

  await prisma.workflowRule.createMany({
    data: [
      { name: "Unassigned jobs alert", trigger: "JOB_UNASSIGNED", organizationId: organization.id },
      { name: "Low equipment availability", trigger: "EQUIPMENT_LOW", organizationId: organization.id },
      { name: "Overdue invoices", trigger: "INVOICE_OVERDUE", organizationId: organization.id },
      { name: "Shift conflicts", trigger: "SHIFT_CONFLICT", organizationId: organization.id },
    ],
  });

  return organization;
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
