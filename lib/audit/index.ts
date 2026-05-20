import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function logAudit({
  action,
  entity,
  entityId,
  userId,
  organizationId,
  metadata,
}: {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  organizationId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      userId,
      organizationId,
      metadata,
    },
  });
}
