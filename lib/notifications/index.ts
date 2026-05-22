import { prisma } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export async function createNotification({
  organizationId,
  userId,
  title,
  message,
  type = "INFO",
  dedupeHours = 24,
}: {
  organizationId: string;
  userId?: string;
  title: string;
  message: string;
  type?: NotificationType;
  dedupeHours?: number;
}) {
  if (dedupeHours > 0) {
    const existing = await prisma.notification.findFirst({
      where: {
        organizationId,
        title,
        createdAt: {
          gte: new Date(Date.now() - dedupeHours * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return existing;
  }

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
