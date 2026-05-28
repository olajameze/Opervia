import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/exports/csv-utils";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function buildJobSummaryCsv(jobId: string, organizationId: string): Promise<string> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId },
    include: {
      project: { include: { client: true } },
      assignments: { include: { staffProfile: true, freelancerProfile: true } },
      equipmentAllocations: {
        where: { endDate: null },
        include: { equipment: true },
      },
    },
  });

  if (!job) throw new Error("Job not found");

  const rows: Record<string, unknown>[] = [
    { section: "Job", field: "Title", value: job.title },
    { section: "Job", field: "Location", value: job.location ?? "" },
    { section: "Job", field: "Status", value: job.status },
    { section: "Job", field: "Scheduled", value: job.scheduledAt?.toISOString() ?? "" },
  ];

  for (const assignment of job.assignments) {
    rows.push({
      section: "People",
      field: assignment.staffProfile ? "Staff" : "Freelancer",
      value: assignment.staffProfile?.name ?? assignment.freelancerProfile?.name ?? "",
    });
  }

  for (const allocation of job.equipmentAllocations) {
    rows.push({
      section: "Equipment",
      field: allocation.equipment.category ?? "Uncategorised",
      value: `${allocation.quantity}× ${allocation.equipment.name}`,
    });
  }

  return toCsv(["section", "field", "value"], rows);
}

export async function buildJobSummaryPdf(jobId: string, organizationId: string): Promise<Uint8Array> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId },
    include: {
      project: { include: { client: true } },
      assignments: { include: { staffProfile: true, freelancerProfile: true } },
      equipmentAllocations: {
        where: { endDate: null },
        include: { equipment: true },
      },
    },
  });

  if (!job) throw new Error("Job not found");

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 800;

  const write = (text: string, size = 12, useBold = false) => {
    page.drawText(text, { x: 50, y, size, font: useBold ? bold : font, color: rgb(0.1, 0.1, 0.1) });
    y -= size + 8;
  };

  write("Opervia Event Summary", 18, true);
  write(`Job: ${job.title}`, 14, true);
  if (job.location) write(`Location: ${job.location}`);
  if (job.scheduledAt) write(`Scheduled: ${job.scheduledAt.toLocaleString("en-GB")}`);
  if (job.project?.client) write(`Client: ${job.project.client.name}`);
  y -= 8;
  write("Staff & Freelancers", 13, true);
  if (job.assignments.length === 0) write("None assigned");
  for (const assignment of job.assignments) {
    const label = assignment.staffProfile
      ? `Staff: ${assignment.staffProfile.name}`
      : `Freelancer: ${assignment.freelancerProfile?.name ?? "Unknown"}`;
    write(label);
  }
  y -= 8;
  write("Equipment", 13, true);
  if (job.equipmentAllocations.length === 0) write("None allocated");
  for (const allocation of job.equipmentAllocations) {
    write(
      `${allocation.quantity}× ${allocation.equipment.name} (${allocation.equipment.category ?? "Uncategorised"})`
    );
  }

  return pdf.save();
}
