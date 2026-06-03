import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { normalizeEquipmentName } from "@/lib/services/equipment-inventory";
import { resolveJobDates } from "@/lib/services/assignments";

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

const JOB_STATUSES = ["DRAFT", "SCHEDULED", "DISPATCHED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
const JOB_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

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

export function parseCsv(text: string): string[][] {
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

export function parseSpreadsheet(buffer: ArrayBuffer, filename: string): string[][] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) {
    const text = new TextDecoder("utf-8").decode(buffer);
    return parseCsv(text);
  }

  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
  return raw.map((row) =>
    row.map((cell) => (cell === null || cell === undefined ? "" : String(cell).trim()))
  );
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

function isValidEmail(value: string): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseJobStatus(value: string): (typeof JOB_STATUSES)[number] {
  const upper = value.toUpperCase();
  if (JOB_STATUSES.includes(upper as (typeof JOB_STATUSES)[number])) {
    return upper as (typeof JOB_STATUSES)[number];
  }
  return "DRAFT";
}

function parseJobPriority(value: string): (typeof JOB_PRIORITIES)[number] {
  const upper = value.toUpperCase();
  if (JOB_PRIORITIES.includes(upper as (typeof JOB_PRIORITIES)[number])) {
    return upper as (typeof JOB_PRIORITIES)[number];
  }
  return "MEDIUM";
}

export async function importSpreadsheetRows(
  resource: ImportResource,
  parsed: string[][],
  organizationId: string
): Promise<ImportSummary> {
  if (parsed.length < 2) {
    return {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 1,
      rows: [{ row: 1, status: "error", message: "File must include a header row and at least one data row" }],
    };
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
          const email = cell(row, headerIndex(headers, ["email"])) || null;
          if (email && !isValidEmail(email)) throw new Error("Invalid email");
          const data = {
            name,
            email,
            phone: cell(row, headerIndex(headers, ["phone"])) || null,
            location: cell(row, headerIndex(headers, ["location"])) || null,
            skills: parseSkills(cell(row, headerIndex(headers, ["skills"]))),
          };
          if (email) {
            const existing = await prisma.staffProfile.findFirst({
              where: { organizationId, email },
            });
            if (existing) {
              await prisma.staffProfile.update({ where: { id: existing.id }, data });
              summary.updated++;
              summary.rows.push({ row: rowNumber, status: "updated", message: "Updated by email" });
              break;
            }
          }
          await prisma.staffProfile.create({ data: { ...data, organizationId } });
          summary.created++;
          summary.rows.push({ row: rowNumber, status: "created" });
          break;
        }
        case "freelancers": {
          const name = cell(row, headerIndex(headers, ["name"]));
          if (!name) throw new Error("Name is required");
          const email = cell(row, headerIndex(headers, ["email"])) || null;
          if (email && !isValidEmail(email)) throw new Error("Invalid email");
          const dayRateRaw = cell(row, headerIndex(headers, ["dayrate", "day rate", "hourlyrate"]));
          const data = {
            name,
            email,
            phone: cell(row, headerIndex(headers, ["phone"])) || null,
            location: cell(row, headerIndex(headers, ["location"])) || null,
            skills: parseSkills(cell(row, headerIndex(headers, ["skills"]))),
            dayRate: dayRateRaw ? Number(dayRateRaw) : null,
          };
          if (email) {
            const existing = await prisma.freelancerProfile.findFirst({
              where: { organizationId, email },
            });
            if (existing) {
              await prisma.freelancerProfile.update({ where: { id: existing.id }, data });
              summary.updated++;
              summary.rows.push({ row: rowNumber, status: "updated", message: "Updated by email" });
              break;
            }
          }
          await prisma.freelancerProfile.create({ data: { ...data, organizationId } });
          summary.created++;
          summary.rows.push({ row: rowNumber, status: "created" });
          break;
        }
        case "equipment": {
          const name = cell(row, headerIndex(headers, ["name"]));
          if (!name) throw new Error("Name is required");
          const qtyRaw = cell(row, headerIndex(headers, ["totalquantity", "quantity", "total quantity"]));
          const quantity = qtyRaw ? Math.max(1, Number(qtyRaw)) : 1;
          if (Number.isNaN(quantity)) throw new Error("Invalid quantity");
          const normalized = normalizeEquipmentName(name);
          const existing = await prisma.equipment.findMany({ where: { organizationId } });
          const match = existing.find(
            (item) => normalizeEquipmentName(item.name) === normalized
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
                name: normalized,
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
          const email = cell(row, headerIndex(headers, ["email"])) || null;
          if (email && !isValidEmail(email)) throw new Error("Invalid email");
          const data = {
            name,
            email,
            phone: cell(row, headerIndex(headers, ["phone"])) || null,
            notes: cell(row, headerIndex(headers, ["notes", "description"])) || null,
          };
          if (email) {
            const existing = await prisma.client.findFirst({
              where: { organizationId, email },
            });
            if (existing) {
              await prisma.client.update({ where: { id: existing.id }, data });
              summary.updated++;
              summary.rows.push({ row: rowNumber, status: "updated", message: "Updated by email" });
              break;
            }
          }
          await prisma.client.create({ data: { ...data, organizationId } });
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
          const startsRaw = cell(row, headerIndex(headers, ["startsat", "start date", "startdate", "scheduledat"]));
          const endsRaw = cell(row, headerIndex(headers, ["endsat", "end date", "enddate"]));
          const dates = resolveJobDates({
            startsAt: startsRaw || undefined,
            endsAt: endsRaw || undefined,
          });
          await prisma.job.create({
            data: {
              title,
              description: cell(row, headerIndex(headers, ["description"])) || null,
              location: cell(row, headerIndex(headers, ["location"])) || null,
              status: parseJobStatus(cell(row, headerIndex(headers, ["status"]))),
              priority: parseJobPriority(cell(row, headerIndex(headers, ["priority"]))),
              startsAt: dates.startsAt,
              endsAt: dates.endsAt,
              scheduledAt: dates.scheduledAt,
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

export async function importCsvResource(
  resource: ImportResource,
  csvText: string,
  organizationId: string
): Promise<ImportSummary> {
  return importSpreadsheetRows(resource, parseCsv(csvText), organizationId);
}

export async function importSpreadsheetResource(
  resource: ImportResource,
  buffer: ArrayBuffer,
  filename: string,
  organizationId: string
): Promise<ImportSummary> {
  const parsed = parseSpreadsheet(buffer, filename);
  return importSpreadsheetRows(resource, parsed, organizationId);
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
      return ["name", "email", "phone", "notes"];
    case "projects":
      return ["name", "description", "status"];
    case "jobs":
      return ["title", "description", "location", "startsAt", "endsAt", "status", "priority"];
  }
}
