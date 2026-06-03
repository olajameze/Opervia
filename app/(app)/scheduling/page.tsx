import { getOrganizationContext } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { RegistryListPanel, type RegistryRow } from "@/components/app/RegistryListPanel";
import { StatCard } from "@/components/app/StatCard";
import {
  JobForm,
  ShiftForm,
  ClientForm,
  ProjectForm,
  FreelancerAssignForm,
} from "@/components/app/ModuleForms";
import {
  SchedulingJobsTableClient,
  SchedulingShiftsTableClient,
  SchedulingAssignmentsTableClient,
} from "@/components/app/SchedulingTables";
import { Calendar, Clock, CheckCircle } from "lucide-react";

export default async function SchedulingPage() {
  const { organization } = await getOrganizationContext();

  const [jobs, shifts, projects, clients, staff, freelancers, assignments] = await Promise.all([
    prisma.job.findMany({
      where: { organizationId: organization.id },
      orderBy: { startsAt: "asc" },
      include: {
        project: true,
        assignments: { include: { staffProfile: true, freelancerProfile: true } },
      },
    }),
    prisma.shift.findMany({
      where: { organizationId: organization.id },
      orderBy: { startTime: "asc" },
      include: { staffProfile: true, job: true },
    }),
    prisma.project.findMany({
      where: { organizationId: organization.id },
      orderBy: { name: "asc" },
      include: { client: true },
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

  const jobOptions = jobs.map((j) => ({ id: j.id, title: j.title }));
  const clientRows: RegistryRow[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email ?? "—",
    phone: c.phone ?? "—",
    notes: c.notes ?? "—",
  }));
  const projectRows: RegistryRow[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    client: p.client?.name ?? "—",
    description: p.description ?? "—",
    status: p.status,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Scheduling & Dispatch</h1>
        <p className="text-muted-foreground">
          Plan jobs, assign staff, schedule freelancers, and manage dispatch.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ClientForm />
        <ProjectForm clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RegistryListPanel
          title="Clients"
          rows={clientRows}
          searchPlaceholder="Search by name, email, phone, notes…"
          filterRow={(row, q) =>
            [row.name, row.email, row.phone, row.notes].join(" ").toLowerCase().includes(q)
          }
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "phone", header: "Phone" },
          ]}
        />
        <RegistryListPanel
          title="Projects"
          rows={projectRows}
          searchPlaceholder="Search by project name or client…"
          filterRow={(row, q) =>
            [row.name, row.client, row.description].join(" ").toLowerCase().includes(q)
          }
          columns={[
            { key: "name", header: "Project" },
            { key: "client", header: "Client" },
            { key: "status", header: "Status" },
          ]}
        />
      </div>

      <JobForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />

      <div className="grid gap-4 lg:grid-cols-2">
        {staff.length > 0 && (
          <ShiftForm
            staff={staff.map((s) => ({ id: s.id, name: s.name }))}
            jobs={jobOptions}
          />
        )}
        {freelancers.length > 0 && jobs.length > 0 && (
          <FreelancerAssignForm
            jobs={jobOptions}
            freelancers={freelancers.map((f) => ({ id: f.id, name: f.name }))}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Scheduled" value={scheduled} icon={Calendar} />
        <StatCard title="In Progress" value={inProgress} icon={Clock} />
        <StatCard title="Completed" value={completed} icon={CheckCircle} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Jobs</h2>
        <SchedulingJobsTableClient
          jobs={jobs}
          freelancers={freelancers.map((f) => ({
            id: f.id,
            name: f.name,
            email: f.email,
          }))}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Scheduled shifts</h2>
        <SchedulingShiftsTableClient shifts={shifts} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Job assignments</h2>
        <SchedulingAssignmentsTableClient assignments={assignments} />
      </div>
    </div>
  );
}
