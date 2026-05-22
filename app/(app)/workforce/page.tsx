import { getOrganizationContext } from "@/lib/auth-helpers";

import { prisma } from "@/lib/db";

import { DataTable } from "@/components/app/DataTable";

import { StatCard } from "@/components/app/StatCard";

import { Badge } from "@/components/ui/badge";

import { StaffForm, FreelancerForm, DeleteButton } from "@/components/app/ModuleForms";

import { formatStaffLimit, formatFreelancerLimit } from "@/lib/entitlements";

import { Users, UserCheck } from "lucide-react";

import { formatCurrency } from "@/lib/utils";



export default async function WorkforcePage() {

  const { organization } = await getOrganizationContext();

  const staffLimitLabel = formatStaffLimit(organization);
  const freelancerLimitLabel = formatFreelancerLimit(organization);



  const [staff, freelancers] = await Promise.all([

    prisma.staffProfile.findMany({

      where: { organizationId: organization.id },

      orderBy: { name: "asc" },

      include: { _count: { select: { assignments: true, shifts: true } } },

    }),

    prisma.freelancerProfile.findMany({

      where: { organizationId: organization.id },

      orderBy: { name: "asc" },

      include: { _count: { select: { assignments: true } } },

    }),

  ]);




  return (

    <div className="space-y-8">

      <div>

        <h1 className="text-2xl font-bold">Workforce</h1>

        <p className="text-muted-foreground">

          Manage staff ({staff.length}/{staffLimitLabel}) and freelancers ({freelancers.length}/{freelancerLimitLabel}).

        </p>

      </div>



      <div className="grid gap-4 md:grid-cols-2">

        <StaffForm />

        <FreelancerForm />

      </div>



      <div className="grid gap-4 sm:grid-cols-2">

        <StatCard title="Staff Members" value={staff.length} icon={Users} />

        <StatCard title="Freelancers" value={freelancers.length} icon={UserCheck} />

      </div>



      <div className="space-y-4">

        <h2 className="text-lg font-semibold">Staff</h2>

        <DataTable

          data={staff}

          emptyMessage="No staff profiles yet."

          columns={[

            { key: "name", header: "Name" },

            { key: "email", header: "Email" },

            {

              key: "skills",

              header: "Skills",

              render: (row) => (

                <div className="flex flex-wrap gap-1">

                  {(row.skills as string[]).slice(0, 3).map((s) => (

                    <Badge key={s} variant="secondary" className="text-xs">

                      {s}

                    </Badge>

                  ))}

                </div>

              ),

            },

            {

              key: "hourlyRate",

              header: "Rate",

              render: (row) =>

                row.hourlyRate ? formatCurrency(row.hourlyRate as number) + "/hr" : "—",

            },

            {

              key: "id",

              header: "Actions",

              render: (row) => (

                <DeleteButton endpoint={`/api/staff/${row.id as string}`} />

              ),

            },

          ]}

        />

      </div>



      <div className="space-y-4">

        <h2 className="text-lg font-semibold">Freelancers</h2>

        <DataTable

          data={freelancers}

          emptyMessage="No freelancer profiles yet."

          columns={[

            { key: "name", header: "Name" },

            { key: "email", header: "Email" },

            {

              key: "skills",

              header: "Skills",

              render: (row) => (

                <div className="flex flex-wrap gap-1">

                  {(row.skills as string[]).slice(0, 3).map((s) => (

                    <Badge key={s} variant="outline" className="text-xs">

                      {s}

                    </Badge>

                  ))}

                </div>

              ),

            },

            {

              key: "hourlyRate",

              header: "Rate",

              render: (row) =>

                row.hourlyRate ? formatCurrency(row.hourlyRate as number) + "/hr" : "—",

            },

            {

              key: "id",

              header: "Actions",

              render: (row) => (

                <DeleteButton endpoint={`/api/freelancers/${row.id as string}`} />

              ),

            },

          ]}

        />

      </div>

    </div>

  );

}

