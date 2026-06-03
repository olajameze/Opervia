"use client";

import { useMemo, useState } from "react";
import { SortableDataTable } from "@/components/app/SortableDataTable";
import { Badge } from "@/components/ui/badge";
import { DeleteButton, StatusSelect } from "@/components/app/ModuleForms";
import { SchedulingJobActions } from "@/components/app/SchedulingJobActions";
import { formatDate } from "@/lib/utils";

type JobRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  location: string | null;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  scheduledAt: Date | string | null;
  project: { name: string } | null;
  assignments: Array<{
    staffProfile?: { name: string } | null;
    freelancerProfile?: { name: string } | null;
  }>;
};

function formatJobRange(job: JobRow): string {
  const start = job.startsAt ?? job.scheduledAt;
  const end = job.endsAt ?? start;
  if (!start) return "—";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : startDate;
  if (startDate.getTime() === endDate.getTime()) return formatDate(startDate);
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export function SchedulingJobsTableClient({
  jobs,
  freelancers,
}: {
  jobs: JobRow[];
  freelancers: { id: string; name: string; email: string | null }[];
}) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) =>
      [j.title, j.location ?? "", j.project?.name ?? "", j.status, j.priority]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [jobs, query]);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search jobs by title, location, project, priority, status…"
        className="flex h-10 w-full max-w-lg rounded-md border px-3 text-sm"
        aria-label="Search jobs"
      />
      <SortableDataTable
        data={rows as unknown as Record<string, unknown>[]}
        scrollable
        emptyMessage="No jobs scheduled yet."
        columns={[
          { key: "title", header: "Job", sortValue: (r) => (r as JobRow).title },
          {
            key: "project",
            header: "Project",
            sortValue: (r) => (r as JobRow).project?.name ?? "",
            render: (row) => (row as JobRow).project?.name ?? "—",
          },
          {
            key: "status",
            header: "Status",
            render: (row) => {
              const j = row as JobRow;
              return (
                <StatusSelect
                  endpoint={`/api/jobs/${j.id}`}
                  field="status"
                  label="Update job status"
                  value={j.status}
                  options={[
                    { value: "DRAFT", label: "Draft" },
                    { value: "SCHEDULED", label: "Scheduled" },
                    { value: "DISPATCHED", label: "Dispatched" },
                    { value: "IN_PROGRESS", label: "In progress" },
                    { value: "COMPLETED", label: "Completed" },
                    { value: "CANCELLED", label: "Cancelled" },
                  ]}
                />
              );
            },
          },
          {
            key: "priority",
            header: "Priority",
            sortValue: (r) => (r as JobRow).priority,
            render: (row) => <Badge variant="outline">{(row as JobRow).priority}</Badge>,
          },
          {
            key: "startsAt",
            header: "Dates",
            sortValue: (r) => {
              const j = r as JobRow;
              const s = j.startsAt ?? j.scheduledAt;
              return s ? new Date(s).getTime() : 0;
            },
            render: (row) => formatJobRange(row as JobRow),
          },
          {
            key: "assignments",
            header: "Assigned",
            render: (row) => {
              const assignments = (row as JobRow).assignments;
              return assignments.length > 0
                ? assignments
                    .map((a) => a.staffProfile?.name ?? a.freelancerProfile?.name ?? "—")
                    .join(", ")
                : "Unassigned";
            },
          },
          {
            key: "id",
            header: "Actions",
            render: (row) => {
              const j = row as JobRow;
              return (
                <div className="space-y-2">
                  <SchedulingJobActions jobId={j.id} freelancers={freelancers} />
                  <DeleteButton endpoint={`/api/jobs/${j.id}`} />
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}

export function SchedulingShiftsTableClient({
  shifts,
}: {
  shifts: Array<{
    id: string;
    startTime: Date | string;
    endTime: Date | string;
    staffProfile: { name: string };
    job: { title: string } | null;
  }>;
}) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shifts;
    return shifts.filter((s) => s.staffProfile.name.toLowerCase().includes(q));
  }, [shifts, query]);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search shifts by staff name…"
        className="flex h-10 w-full max-w-md rounded-md border px-3 text-sm"
        aria-label="Search shifts"
      />
      <SortableDataTable
        data={rows as unknown as Record<string, unknown>[]}
        scrollable
        emptyMessage="No shifts scheduled."
        columns={[
          {
            key: "staffProfile",
            header: "Staff",
            sortValue: (r) =>
              (r as { staffProfile: { name: string } }).staffProfile.name,
            render: (row) =>
              (row as { staffProfile: { name: string } }).staffProfile.name,
          },
          {
            key: "job",
            header: "Job",
            sortValue: (r) => (r as { job: { title: string } | null }).job?.title ?? "",
            render: (row) => (row as { job: { title: string } | null }).job?.title ?? "—",
          },
          {
            key: "startTime",
            header: "Start",
            sortValue: (r) => new Date((r as { startTime: Date }).startTime).getTime(),
            render: (row) => formatDate(new Date((row as { startTime: Date }).startTime)),
          },
          {
            key: "endTime",
            header: "End",
            sortValue: (r) => new Date((r as { endTime: Date }).endTime).getTime(),
            render: (row) => formatDate(new Date((row as { endTime: Date }).endTime)),
          },
          {
            key: "id",
            header: "Actions",
            render: (row) => (
              <DeleteButton endpoint={`/api/shifts/${(row as { id: string }).id}`} />
            ),
          },
        ]}
      />
    </div>
  );
}

export function SchedulingAssignmentsTableClient({
  assignments,
}: {
  assignments: Array<{
    id: string;
    assignedAt: Date | string;
    startTime: Date | string | null;
    endTime: Date | string | null;
    job: { title: string };
    staffProfile: { name: string } | null;
    freelancerProfile: { name: string } | null;
  }>;
}) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assignments;
    return assignments.filter((a) => {
      const name = a.staffProfile?.name ?? a.freelancerProfile?.name ?? "";
      return [a.job.title, name].join(" ").toLowerCase().includes(q);
    });
  }, [assignments, query]);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search assignments by job or assignee…"
        className="flex h-10 w-full max-w-md rounded-md border px-3 text-sm"
        aria-label="Search assignments"
      />
      <SortableDataTable
        data={rows as unknown as Record<string, unknown>[]}
        scrollable
        emptyMessage="No assignments yet."
        columns={[
          {
            key: "job",
            header: "Job",
            sortValue: (r) => (r as { job: { title: string } }).job.title,
            render: (row) => (row as { job: { title: string } }).job.title,
          },
          {
            key: "assignee",
            header: "Assigned to",
            render: (row) => {
              const a = row as {
                staffProfile: { name: string } | null;
                freelancerProfile: { name: string } | null;
                startTime: Date | string | null;
                endTime: Date | string | null;
              };
              const name = a.staffProfile?.name ?? a.freelancerProfile?.name ?? "—";
              if (a.freelancerProfile && a.startTime && a.endTime) {
                return `${name} (${formatDate(new Date(a.startTime))} – ${formatDate(new Date(a.endTime))})`;
              }
              return name;
            },
          },
          {
            key: "assignedAt",
            header: "Assigned",
            sortValue: (r) => new Date((r as { assignedAt: Date }).assignedAt).getTime(),
            render: (row) =>
              formatDate(new Date((row as { assignedAt: Date }).assignedAt)),
          },
          {
            key: "id",
            header: "Actions",
            render: (row) => (
              <DeleteButton
                endpoint={`/api/assignments/${(row as { id: string }).id}`}
                label="Remove"
              />
            ),
          },
        ]}
      />
    </div>
  );
}
