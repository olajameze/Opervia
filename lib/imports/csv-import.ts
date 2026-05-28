import { prisma } from "@/lib/db";

export type ImportResource =
  | "staff"
  | "freelancers"
  | "equipment"
  | "projects"
  | "jobs"
  | "clients";

export const IMPORT_RESOURCES: ImportResource[] = [
  "staff",
  "freelancers",
  "equipment",
  "projects",
  "jobs",
  "clients",
];

export type ImportRowResult = {
  row: number;
  status: "created" | "updated" | "skipped" | "error";
  message?: string;
};

export type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  rows: ImportRowResult[];
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(current);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }

  return rows;
}

function headerIndex(headers: string[], names: string[]): number {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  for (const name of names) {
    const idx = normalized.indexOf(name.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

function cell(row: string[], index: number): string {
  return index >= 0 ? row[index]?.trim() ?? "" : "";
}

function parseSkills(value: string): string[] {
  if (!value) return [];
  return value.split(/[|;]/).map((s) => s.trim()).filter(Boolean);
}

export async function importCsvResource(
  resource: ImportResource,
  csvText: string,
  organizationId: string
): Promise<ImportSummary> {
  const parsed = parseCsv(csvText);
  if (parsed.length < 2) {
    return { created: 0, updated: 0, skipped: 0, errors: 1, rows: [{ row: 1, status: "error", message: "CSV must include a header row and at least one data row" }] };
  }

  const headers = parsed[0];
  const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, errors: 0, rows: [] };

  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i];
    const rowNumber = i + 1;

    try {
      switch (resource) {
        case "staff": {
          const name = cell(row, headerIndex(headers, ["name"]));
          if (!name) throw new Error("Name is required");
          await prisma.staffProfile.create({
            data: {
              name,
              email: cell(row, headerIndex(headers, ["email"])) || null,
              phone: cell(row, headerIndex(headers, ["phone"])) || null,
              location: cell(row, headerIndex(headers, ["location"])) || null,
              skills: parseSkills(cell(row, headerIndex(headers, ["skills"]))),
              organizationId,
            },
          });
          summary.created++;
          summary.rows.push({ row: rowNumber, status: "created" });
          break;
        }
        case "freelancers": {
          const name = cell(row, headerIndex(headers, ["name"]));
          if (!name) throw new Error("Name is required");
          const dayRateRaw = cell(row, headerIndex(headers, ["dayrate", "day rate", "hourlyrate"]));
          await prisma.freelancerProfile.create({
            data: {
              name,
              email: cell(row, headerIndex(headers, ["email"])) || null,
              phone: cell(row, headerIndex(headers, ["phone"])) || null,
              location: cell(row, headerIndex(headers, ["location"])) || null,
              skills: parseSkills(cell(row, headerIndex(headers, ["skills"]))),
              dayRate: dayRateRaw ? Number(dayRateRaw) : null,
              organizationId,
            },
          });
          summary.created++;
          summary.rows.push({ row: rowNumber, status: "created" });
          break;
        }
        case "equipment": {
          const name = cell(row, headerIndex(headers, ["name"]));
          if (!name) throw new Error("Name is required");
          const qtyRaw = cell(row, headerIndex(headers, ["totalquantity", "quantity", "total quantity"]));
          const quantity = qtyRaw ? Number(qtyRaw) : 1;
          const existing = await prisma.equipment.findMany({ where: { organizationId } });
          const match = existing.find(
            (item) => item.name.trim().toLowerCase() === name.trim().toLowerCase()
          );
          if (match) {
            await prisma.equipment.update({
              where: { id: match.id },
              data: { totalQuantity: { increment: quantity } },
            });
            summary.updated++;
            summary.rows.push({ row: rowNumber, status: "updated", message: "Merged into existing item" });
          } else {
            await prisma.equipment.create({
              data: {
                name: name.trim(),
                sku: cell(row, headerIndex(headers, ["sku"])) || null,
                category: cell(row, headerIndex(headers, ["category"])) || null,
                dailyRate: Number(cell(row, headerIndex(headers, ["dailyrate", "daily rate"])) || "") || null,
                totalQuantity: quantity,
                organizationId,
              },
            });
            summary.created++;
            summary.rows.push({ row: rowNumber, status: "created" });
          }
          break;
        }
        case "clients": {
          const name = cell(row, headerIndex(headers, ["name"]));
          if (!name) throw new Error("Name is required");
          await prisma.client.create({
            data: {
              name,
              email: cell(row, headerIndex(headers, ["email"])) || null,
              phone: cell(row, headerIndex(headers, ["phone"])) || null,
              organizationId,
            },
          });
          summary.created++;
          summary.rows.push({ row: rowNumber, status: "created" });
          break;
        }
        case "projects": {
          const name = cell(row, headerIndex(headers, ["name"]));
          if (!name) throw new Error("Name is required");
          await prisma.project.create({
            data: {
              name,
              description: cell(row, headerIndex(headers, ["description"])) || null,
              status: cell(row, headerIndex(headers, ["status"])) || "active",
              organizationId,
            },
          });
          summary.created++;
          summary.rows.push({ row: rowNumber, status: "created" });
          break;
        }
        case "jobs": {
          const title = cell(row, headerIndex(headers, ["title"]));
          if (!title) throw new Error("Title is required");
          await prisma.job.create({
            data: {
              title,
              description: cell(row, headerIndex(headers, ["description"])) || null,
              location: cell(row, headerIndex(headers, ["location"])) || null,
              status: (cell(row, headerIndex(headers, ["status"])) || "DRAFT") as "DRAFT",
              priority: (cell(row, headerIndex(headers, ["priority"])) || "MEDIUM") as "MEDIUM",
              organizationId,
            },
          });
          summary.created++;
          summary.rows.push({ row: rowNumber, status: "created" });
          break;
        }
      }
    } catch (error) {
      summary.errors++;
      summary.rows.push({
        row: rowNumber,
        status: "error",
        message: error instanceof Error ? error.message : "Import failed",
      });
    }
  }

  return summary;
}

export function importTemplateHeaders(resource: ImportResource): string[] {
  switch (resource) {
    case "staff":
      return ["name", "email", "phone", "location", "skills"];
    case "freelancers":
      return ["name", "email", "phone", "location", "skills", "dayRate"];
    case "equipment":
      return ["name", "sku", "category", "totalQuantity", "dailyRate"];
    case "clients":
      return ["name", "email", "phone"];
    case "projects":
      return ["name", "description", "status"];
    case "jobs":
      return ["title", "description", "location", "status", "priority"];
  }
}
