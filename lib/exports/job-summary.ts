import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/exports/csv-utils";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function formatJobDateRange(job: {
  startsAt: Date | null;
  endsAt: Date | null;
  scheduledAt: Date | null;
}): string {
  const start = job.startsAt ?? job.scheduledAt;
  const end = job.endsAt ?? start;
  if (!start) return "";
  if (!end || start.getTime() === end.getTime()) {
    return start.toLocaleDateString("en-GB");
  }
  return `${start.toLocaleDateString("en-GB")} – ${end.toLocaleDateString("en-GB")}`;
}

async function loadJobSummary(jobId: string, organizationId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId },
    include: {
      project: { include: { client: true } },
      assignments: { include: { staffProfile: true, freelancerProfile: true } },
      equipmentAllocations: { include: { equipment: true } },
      shifts: { include: { staffProfile: true } },
    },
  });
  if (!job) throw new Error("Job not found");
  return job;
}

function groupEquipmentByCategory(
  allocations: Array<{
    quantity: number;
    equipment: { name: string; category: string | null };
  }>
) {
  const groups = new Map<string, string[]>();
  for (const allocation of allocations) {
    const category = allocation.equipment.category ?? "Uncategorised";
    const line = `${allocation.quantity}× ${allocation.equipment.name}`;
    const list = groups.get(category) ?? [];
    list.push(line);
    groups.set(category, list);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export async function buildJobSummaryCsv(jobId: string, organizationId: string): Promise<string> {
  const job = await loadJobSummary(jobId, organizationId);

  const rows: Record<string, unknown>[] = [
    { section: "Job", field: "Title", value: job.title },
    { section: "Job", field: "Description", value: job.description ?? "" },
    { section: "Job", field: "Location", value: job.location ?? "" },
    { section: "Job", field: "Status", value: job.status },
    { section: "Job", field: "Dates", value: formatJobDateRange(job) },
    { section: "Job", field: "Project", value: job.project?.name ?? "" },
    { section: "Job", field: "Client", value: job.project?.client?.name ?? "" },
  ];

  for (const shift of job.shifts) {
    rows.push({
      section: "Staff shifts",
      field: shift.staffProfile.name,
      value: `${shift.startTime.toISOString()} – ${shift.endTime.toISOString()}`,
    });
  }

  for (const assignment of job.assignments) {
    if (assignment.staffProfile) {
      rows.push({
        section: "Staff",
        field: assignment.staffProfile.name,
        value: "Assigned",
      });
    }
    if (assignment.freelancerProfile) {
      const times =
        assignment.startTime && assignment.endTime
          ? `${assignment.startTime.toISOString()} – ${assignment.endTime.toISOString()}`
          : "Assigned";
      rows.push({
        section: "Freelancers",
        field: assignment.freelancerProfile.name,
        value: times,
      });
    }
  }

  for (const [category, lines] of groupEquipmentByCategory(job.equipmentAllocations)) {
    for (const line of lines) {
      rows.push({ section: "Equipment", field: category, value: line });
    }
  }

  return toCsv(["section", "field", "value"], rows);
}

export async function buildJobSummaryPdf(jobId: string, organizationId: string): Promise<Uint8Array> {
  const job = await loadJobSummary(jobId, organizationId);

  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 800;

  const write = (text: string, size = 12, useBold = false) => {
    if (y < 60) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }
    page.drawText(text.slice(0, 90), {
      x: 50,
      y,
      size,
      font: useBold ? bold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= size + 8;
  };

  write("Opervia Event Summary", 18, true);
  write(`Job: ${job.title}`, 14, true);
  if (job.description) write(`Description: ${job.description}`);
  if (job.location) write(`Location: ${job.location}`);
  const dates = formatJobDateRange(job);
  if (dates) write(`Dates: ${dates}`);
  if (job.project?.name) write(`Project: ${job.project.name}`);
  if (job.project?.client) {
    write(`Client: ${job.project.client.name}`);
    if (job.project.client.email) write(`Client email: ${job.project.client.email}`);
    if (job.project.client.phone) write(`Client phone: ${job.project.client.phone}`);
  }

  y -= 8;
  write("Staff shifts", 13, true);
  if (job.shifts.length === 0) write("None scheduled");
  for (const shift of job.shifts) {
    write(
      `${shift.staffProfile.name}: ${shift.startTime.toLocaleString("en-GB")} – ${shift.endTime.toLocaleString("en-GB")}`
    );
    if (shift.notes) write(`  Notes: ${shift.notes}`);
  }

  y -= 8;
  write("Freelancers", 13, true);
  const freelancers = job.assignments.filter((a) => a.freelancerProfile);
  if (freelancers.length === 0) write("None assigned");
  for (const assignment of freelancers) {
    const name = assignment.freelancerProfile?.name ?? "Unknown";
    if (assignment.startTime && assignment.endTime) {
      write(
        `${name}: ${assignment.startTime.toLocaleString("en-GB")} – ${assignment.endTime.toLocaleString("en-GB")}`
      );
    } else {
      write(name);
    }
  }

  y -= 8;
  write("Equipment by category", 13, true);
  const equipmentGroups = groupEquipmentByCategory(job.equipmentAllocations);
  if (equipmentGroups.length === 0) write("None allocated");
  for (const [category, lines] of equipmentGroups) {
    write(category, 12, true);
    for (const line of lines) write(`  ${line}`);
  }

  return pdf.save();
}
