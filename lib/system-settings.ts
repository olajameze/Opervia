import { prisma } from "@/lib/db";

export async function getSystemSettings() {
  return prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

export async function setMaintenanceMode(enabled: boolean, message?: string) {
  return prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {
      maintenanceMode: enabled,
      maintenanceMessage: message ?? null,
    },
    create: {
      id: "default",
      maintenanceMode: enabled,
      maintenanceMessage: message ?? null,
    },
  });
}
