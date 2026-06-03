import { prisma } from "@/lib/db";
import type { JobStatus } from "@prisma/client";

export async function createFreelancerAssignment(params: {
  jobId: string;
  freelancerProfileId: string;
  organizationId: string;
  startTime?: Date | null;
  endTime?: Date | null;
}) {
  const existing = await prisma.assignment.findFirst({
    where: {
      jobId: params.jobId,
      freelancerProfileId: params.freelancerProfileId,
      organizationId: params.organizationId,
    },
  });
  if (existing) return existing;

  const job = await prisma.job.findFirst({
    where: { id: params.jobId, organizationId: params.organizationId },
  });
  if (!job) throw new Error("Job not found");

  const assignment = await prisma.assignment.create({
    data: {
      jobId: params.jobId,
      freelancerProfileId: params.freelancerProfileId,
      organizationId: params.organizationId,
      startTime: params.startTime ?? null,
      endTime: params.endTime ?? null,
    },
  });

  await maybeDispatchJob(job.id, job.status);
  return assignment;
}

export async function createStaffAssignment(params: {
  jobId: string;
  staffProfileId: string;
  organizationId: string;
}) {
  const existing = await prisma.assignment.findFirst({
    where: {
      jobId: params.jobId,
      staffProfileId: params.staffProfileId,
      organizationId: params.organizationId,
    },
  });
  if (existing) return existing;

  const job = await prisma.job.findFirst({
    where: { id: params.jobId, organizationId: params.organizationId },
  });
  if (!job) throw new Error("Job not found");

  const assignment = await prisma.assignment.create({
    data: {
      jobId: params.jobId,
      staffProfileId: params.staffProfileId,
      organizationId: params.organizationId,
    },
  });

  await maybeDispatchJob(job.id, job.status);
  return assignment;
}

async function maybeDispatchJob(jobId: string, status: JobStatus) {
  if (status === "DRAFT" || status === "SCHEDULED") {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "DISPATCHED" },
    });
  }
}

export function resolveJobDates(input: {
  startsAt?: string;
  endsAt?: string;
  scheduledAt?: string;
}): { startsAt: Date | null; endsAt: Date | null; scheduledAt: Date | null } {
  const startsAt = input.startsAt
    ? new Date(input.startsAt)
    : input.scheduledAt
      ? new Date(input.scheduledAt)
      : null;
  const endsAt = input.endsAt
    ? new Date(input.endsAt)
    : startsAt;
  const scheduledAt = startsAt;
  return { startsAt, endsAt, scheduledAt };
}
