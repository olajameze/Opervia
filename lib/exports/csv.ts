import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/exports/csv-utils";

export type ExportResource = "jobs" | "invoices" | "equipment" | "staff" | "freelancers";

export const EXPORT_RESOURCES: ExportResource[] = [
  "jobs",
  "invoices",
  "equipment",
  "staff",
  "freelancers",
];

export async function buildExportCsv(
  resource: ExportResource,
  organizationId: string
): Promise<string> {
  switch (resource) {
    case "jobs": {
      const rows = await prisma.job.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        include: { project: { select: { name: true } } },
      });
      return toCsv(
        [
          "id",
          "title",
          "status",
          "priority",
          "project",
          "location",
          "scheduledAt",
          "completedAt",
          "createdAt",
        ],
        rows.map((row) => ({
          id: row.id,
          title: row.title,
          status: row.status,
          priority: row.priority,
          project: row.project?.name ?? "",
          location: row.location ?? "",
          scheduledAt: row.scheduledAt?.toISOString() ?? "",
          completedAt: row.completedAt?.toISOString() ?? "",
          createdAt: row.createdAt.toISOString(),
        }))
      );
    }
    case "invoices": {
      const rows = await prisma.invoice.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
      });
      return toCsv(
        ["id", "number", "amount", "currency", "status", "dueDate", "createdAt"],
        rows.map((row) => ({
          id: row.id,
          number: row.number,
          amount: row.amount,
          currency: row.currency,
          status: row.status,
          dueDate: row.dueDate?.toISOString() ?? "",
          createdAt: row.createdAt.toISOString(),
        }))
      );
    }
    case "equipment": {
      const rows = await prisma.equipment.findMany({
        where: { organizationId },
        orderBy: { name: "asc" },
      });
      return toCsv(
        ["id", "name", "sku", "category", "totalQuantity", "status", "dailyRate", "createdAt"],
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          sku: row.sku ?? "",
          category: row.category ?? "",
          totalQuantity: row.totalQuantity,
          status: row.status,
          dailyRate: row.dailyRate ?? "",
          createdAt: row.createdAt.toISOString(),
        }))
      );
    }
    case "staff": {
      const rows = await prisma.staffProfile.findMany({
        where: { organizationId },
        orderBy: { name: "asc" },
      });
      return toCsv(
        ["id", "name", "email", "phone", "location", "skills", "createdAt"],
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email ?? "",
          phone: row.phone ?? "",
          location: row.location ?? "",
          skills: row.skills.join("; "),
          createdAt: row.createdAt.toISOString(),
        }))
      );
    }
    case "freelancers": {
      const rows = await prisma.freelancerProfile.findMany({
        where: { organizationId },
        orderBy: { name: "asc" },
      });
      return toCsv(
        ["id", "name", "email", "phone", "location", "skills", "dayRate", "createdAt"],
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email ?? "",
          phone: row.phone ?? "",
          location: row.location ?? "",
          skills: row.skills.join("; "),
          dayRate: row.dayRate ?? "",
          createdAt: row.createdAt.toISOString(),
        }))
      );
    }
    default:
      throw new Error("Unknown export resource");
  }
}

export function exportFilename(resource: ExportResource, slug: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `opervia-${resource}-${slug}-${date}.csv`;
}
