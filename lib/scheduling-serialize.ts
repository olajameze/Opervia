/** Plain JSON-safe shapes for scheduling client tables. */

export type SerializedJobRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  location: string | null;
  startsAt: string | null;
  endsAt: string | null;
  scheduledAt: string | null;
  project: { name: string } | null;
  assignments: Array<{
    staffProfile: { name: string } | null;
    freelancerProfile: { name: string } | null;
  }>;
};

export type SerializedShiftRow = {
  id: string;
  startTime: string;
  endTime: string;
  staffProfile: { name: string };
  job: { title: string } | null;
};

export type SerializedAssignmentRow = {
  id: string;
  assignedAt: string;
  startTime: string | null;
  endTime: string | null;
  job: { title: string };
  staffProfile: { name: string } | null;
  freelancerProfile: { name: string } | null;
};

export function serializeSchedulingJobs(
  jobs: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    location: string | null;
    startsAt: Date | null;
    endsAt: Date | null;
    scheduledAt: Date | null;
    project: { name: string } | null;
    assignments: Array<{
      staffProfile: { name: string } | null;
      freelancerProfile: { name: string } | null;
    }>;
  }>
): SerializedJobRow[] {
  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    status: job.status,
    priority: job.priority,
    location: job.location,
    startsAt: job.startsAt?.toISOString() ?? null,
    endsAt: job.endsAt?.toISOString() ?? null,
    scheduledAt: job.scheduledAt?.toISOString() ?? null,
    project: job.project ? { name: job.project.name } : null,
    assignments: job.assignments.map((a) => ({
      staffProfile: a.staffProfile ? { name: a.staffProfile.name } : null,
      freelancerProfile: a.freelancerProfile ? { name: a.freelancerProfile.name } : null,
    })),
  }));
}

export function serializeSchedulingShifts(
  shifts: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    staffProfile: { name: string };
    job: { title: string } | null;
  }>
): SerializedShiftRow[] {
  return shifts.map((shift) => ({
    id: shift.id,
    startTime: shift.startTime.toISOString(),
    endTime: shift.endTime.toISOString(),
    staffProfile: { name: shift.staffProfile.name },
    job: shift.job ? { title: shift.job.title } : null,
  }));
}

export function serializeSchedulingAssignments(
  assignments: Array<{
    id: string;
    assignedAt: Date;
    startTime: Date | null;
    endTime: Date | null;
    job: { title: string };
    staffProfile: { name: string } | null;
    freelancerProfile: { name: string } | null;
  }>
): SerializedAssignmentRow[] {
  return assignments.map((a) => ({
    id: a.id,
    assignedAt: a.assignedAt.toISOString(),
    startTime: a.startTime?.toISOString() ?? null,
    endTime: a.endTime?.toISOString() ?? null,
    job: { title: a.job.title },
    staffProfile: a.staffProfile ? { name: a.staffProfile.name } : null,
    freelancerProfile: a.freelancerProfile ? { name: a.freelancerProfile.name } : null,
  }));
}
