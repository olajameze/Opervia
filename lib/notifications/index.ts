import { prisma } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export async function createNotification({
  organizationId,
  userId,
  title,
  message,
  type = "INFO",
}: {
  organizationId: string;
  userId?: string;
  title: string;
  message: string;
  type?: NotificationType;
}) {
  return prisma.notification.create({
    data: { organizationId, userId, title, message, type },
  });
}

export async function getUnreadNotifications(
  organizationId: string,
  userId?: string
) {
  return prisma.notification.findMany({
    where: {
      organizationId,
      read: false,
      ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
