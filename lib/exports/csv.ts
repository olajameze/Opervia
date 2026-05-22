import { prisma } from "@/lib/db";

export type ExportResource = "jobs" | "invoices" | "equipment" | "staff" | "freelancers";

export const EXPORT_RESOURCES: ExportResource[] = [
  "jobs",
  "invoices",
  "equipment",
  "staff",
  "freelancers",
];

function escapeCsv(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ];
  return lines.join("\r\n");
}

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
        ["id", "name", "sku", "category", "status", "dailyRate", "createdAt"],
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          sku: row.sku ?? "",
          category: row.category ?? "",
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
        ["id", "name", "email", "phone", "skills", "hourlyRate", "createdAt"],
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email ?? "",
          phone: row.phone ?? "",
          skills: row.skills.join("; "),
          hourlyRate: row.hourlyRate ?? "",
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
        ["id", "name", "email", "phone", "skills", "hourlyRate", "createdAt"],
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email ?? "",
          phone: row.phone ?? "",
          skills: row.skills.join("; "),
          hourlyRate: row.hourlyRate ?? "",
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
