import { getOrganizationContext } from "@/lib/auth-helpers";

import { prisma } from "@/lib/db";

import { DataTable } from "@/components/app/DataTable";

import { StatCard } from "@/components/app/StatCard";

import { Badge } from "@/components/ui/badge";

import {

  JobForm,

  ShiftForm,

  ClientForm,

  ProjectForm,

  JobAssignForm,

  DeleteButton,

  StatusSelect,

} from "@/components/app/ModuleForms";

import { Calendar, Clock, CheckCircle } from "lucide-react";

import { formatDate } from "@/lib/utils";



export default async function SchedulingPage() {

  const { organization } = await getOrganizationContext();



  const [jobs, shifts, projects, clients, staff, freelancers, assignments] = await Promise.all([

    prisma.job.findMany({

      where: { organizationId: organization.id },

      orderBy: { scheduledAt: "asc" },

      include: {

        project: true,

        assignments: { include: { staffProfile: true, freelancerProfile: true } },

      },

    }),

    prisma.shift.findMany({

      where: { organizationId: organization.id },

      orderBy: { startTime: "asc" },

      take: 20,

      include: { staffProfile: true },

    }),

    prisma.project.findMany({

      where: { organizationId: organization.id },

      orderBy: { name: "asc" },

    }),

    prisma.client.findMany({

      where: { organizationId: organization.id },

      orderBy: { name: "asc" },

    }),

    prisma.staffProfile.findMany({

      where: { organizationId: organization.id },

      orderBy: { name: "asc" },

    }),

    prisma.freelancerProfile.findMany({

      where: { organizationId: organization.id },

      orderBy: { name: "asc" },

    }),

    prisma.assignment.findMany({

      where: { organizationId: organization.id },

      orderBy: { assignedAt: "desc" },

      take: 20,

      include: {

        job: true,

        staffProfile: true,

        freelancerProfile: true,

      },

    }),

  ]);



  const scheduled = jobs.filter((j) => j.status === "SCHEDULED").length;

  const inProgress = jobs.filter((j) => j.status === "IN_PROGRESS").length;

  const completed = jobs.filter((j) => j.status === "COMPLETED").length;



  return (

    <div className="space-y-8">

      <div>

        <h1 className="text-2xl font-bold">Scheduling & Dispatch</h1>

        <p className="text-muted-foreground">

          Plan jobs, assign staff, and manage shift schedules.

        </p>

      </div>



      <div className="grid gap-4 md:grid-cols-2">

        <ClientForm />

        <ProjectForm clients={clients.map((c) => ({ id: c.id, name: c.name }))} />

      </div>



      <div className="grid gap-4 lg:grid-cols-2">

        <JobForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />

        {staff.length > 0 && (

          <ShiftForm staff={staff.map((s) => ({ id: s.id, name: s.name }))} />

        )}

      </div>



      {jobs.length > 0 && (staff.length > 0 || freelancers.length > 0) && (

        <JobAssignForm

          jobs={jobs.map((j) => ({ id: j.id, title: j.title }))}

          staff={staff.map((s) => ({ id: s.id, name: s.name }))}

          freelancers={freelancers.map((f) => ({ id: f.id, name: f.name }))}

        />

      )}



      <div className="grid gap-4 sm:grid-cols-3">

        <StatCard title="Scheduled" value={scheduled} icon={Calendar} />

        <StatCard title="In Progress" value={inProgress} icon={Clock} />

        <StatCard title="Completed" value={completed} icon={CheckCircle} />

      </div>



      <div className="space-y-4">

        <h2 className="text-lg font-semibold">Jobs</h2>

        <DataTable

          data={jobs}

          emptyMessage="No jobs scheduled yet."

          columns={[

            { key: "title", header: "Job" },

            {

              key: "project",

              header: "Project",

              render: (row) =>

                (row.project as { name: string } | null)?.name ?? "—",

            },

            {

              key: "status",

              header: "Status",

              render: (row) => (

                <StatusSelect

                  endpoint={`/api/jobs/${row.id as string}`}

                  field="status"

                  label="Update job status"

                  value={String(row.status)}

                  options={[

                    { value: "DRAFT", label: "Draft" },

                    { value: "SCHEDULED", label: "Scheduled" },

                    { value: "DISPATCHED", label: "Dispatched" },

                    { value: "IN_PROGRESS", label: "In progress" },

                    { value: "COMPLETED", label: "Completed" },

                    { value: "CANCELLED", label: "Cancelled" },

                  ]}

                />

              ),

            },

            {

              key: "priority",

              header: "Priority",

              render: (row) => <Badge variant="outline">{String(row.priority)}</Badge>,

            },

            {

              key: "scheduledAt",

              header: "Scheduled",

              render: (row) => formatDate(row.scheduledAt as Date | null),

            },

            {

              key: "assignments",

              header: "Assigned",

              render: (row) => {

                const assignments = row.assignments as Array<{

                  staffProfile?: { name: string };

                  freelancerProfile?: { name: string };

                }>;

                return assignments.length > 0

                  ? assignments

                      .map(

                        (a) =>

                          a.staffProfile?.name ?? a.freelancerProfile?.name ?? "—"

                      )

                      .join(", ")

                  : "Unassigned";

              },

            },

            {

              key: "id",

              header: "Actions",

              render: (row) => (

                <DeleteButton endpoint={`/api/jobs/${row.id as string}`} />

              ),

            },

          ]}

        />

      </div>



      <div className="space-y-4">

        <h2 className="text-lg font-semibold">Upcoming Shifts</h2>

        <DataTable

          data={shifts}

          emptyMessage="No shifts scheduled."

          columns={[

            {

              key: "staffProfile",

              header: "Staff",

              render: (row) => (row.staffProfile as { name: string }).name,

            },

            {

              key: "startTime",

              header: "Start",

              render: (row) => formatDate(row.startTime as Date),

            },

            {

              key: "endTime",

              header: "End",

              render: (row) => formatDate(row.endTime as Date),

            },

            {

              key: "id",

              header: "Actions",

              render: (row) => (

                <DeleteButton endpoint={`/api/shifts/${row.id as string}`} />

              ),

            },

          ]}

        />

      </div>



      <div className="space-y-4">

        <h2 className="text-lg font-semibold">Job Assignments</h2>

        <DataTable

          data={assignments}

          emptyMessage="No assignments yet."

          columns={[

            {

              key: "job",

              header: "Job",

              render: (row) => (row.job as { title: string }).title,

            },

            {

              key: "assignee",

              header: "Assigned to",

              render: (row) =>

                (row.staffProfile as { name: string } | null)?.name ??

                (row.freelancerProfile as { name: string } | null)?.name ??

                "—",

            },

            {

              key: "assignedAt",

              header: "Assigned",

              render: (row) => formatDate(row.assignedAt as Date),

            },

            {

              key: "id",

              header: "Actions",

              render: (row) => (

                <DeleteButton endpoint={`/api/assignments/${row.id as string}`} label="Remove" />

              ),

            },

          ]}

        />

      </div>

    </div>

  );

}

