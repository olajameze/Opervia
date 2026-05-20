import { getOrganizationContext } from "@/lib/auth-helpers";

import { prisma } from "@/lib/db";

import { DataTable } from "@/components/app/DataTable";

import { StatCard } from "@/components/app/StatCard";

import { Badge } from "@/components/ui/badge";

import {

  EquipmentForm,

  EquipmentAllocationForm,

  DeleteButton,

  ReleaseAllocationButton,

  StatusSelect,

} from "@/components/app/ModuleForms";

import { Package, Wrench, CheckCircle } from "lucide-react";

import { formatCurrency } from "@/lib/utils";



export default async function RentalsPage() {

  const { organization } = await getOrganizationContext();



  const [equipment, jobs] = await Promise.all([

    prisma.equipment.findMany({

      where: { organizationId: organization.id },

      orderBy: { name: "asc" },

      include: {
        allocations: {
          where: { endDate: null },
          take: 1,
          include: {
            job: {
              include: {
                project: { include: { client: true } },
                assignments: {
                  include: { staffProfile: true, freelancerProfile: true },
                  take: 1,
                },
              },
            },
          },
        },
      },

    }),

    prisma.job.findMany({

      where: { organizationId: organization.id },

      orderBy: { title: "asc" },

    }),

  ]);



  const available = equipment.filter((e) => e.status === "AVAILABLE").length;

  const rented = equipment.filter((e) => e.status === "RENTED").length;

  const maintenance = equipment.filter((e) => e.status === "MAINTENANCE").length;



  return (

    <div className="space-y-8">

      <div>

        <h1 className="text-2xl font-bold">Equipment Rentals</h1>

        <p className="text-muted-foreground">

          Manage inventory, allocations, and rental status.

        </p>

      </div>



      <div className="grid gap-4 lg:grid-cols-2">

        <EquipmentForm />

        {equipment.length > 0 && (

          <EquipmentAllocationForm

            equipment={equipment.map((e) => ({ id: e.id, name: e.name }))}

            jobs={jobs.map((j) => ({ id: j.id, title: j.title }))}

          />

        )}

      </div>



      <div className="grid gap-4 sm:grid-cols-3">

        <StatCard title="Available" value={available} icon={CheckCircle} />

        <StatCard title="Currently Rented" value={rented} icon={Package} />

        <StatCard title="In Maintenance" value={maintenance} icon={Wrench} />

      </div>



      <DataTable

        data={equipment}

        emptyMessage="No equipment added yet. Add your first item to get started."

        columns={[

          { key: "name", header: "Equipment" },

          { key: "sku", header: "SKU" },

          { key: "category", header: "Category" },

          {

            key: "status",

            header: "Status",

            render: (row) => (

              <StatusSelect

                endpoint={`/api/equipment/${row.id as string}`}

                field="status"

                label="Update equipment status"

                value={String(row.status)}

                options={[

                  { value: "AVAILABLE", label: "Available" },

                  { value: "RENTED", label: "Rented" },

                  { value: "MAINTENANCE", label: "Maintenance" },

                  { value: "RETIRED", label: "Retired" },

                ]}

              />

            ),

          },

          {

            key: "allocations",

            header: "Allocated to",

            render: (row) => {

              const allocation = (row.allocations as Array<{
                id: string;
                startDate: Date;
                job?: {
                  title: string;
                  project?: { client?: { name: string } | null } | null;
                  assignments?: Array<{
                    staffProfile?: { name: string } | null;
                    freelancerProfile?: { name: string } | null;
                  }>;
                } | null;
              }>)[0];

              if (!allocation) return <span className="text-muted-foreground">—</span>;

              const job = allocation.job;
              const client = job?.project?.client?.name;
              const assignee =
                job?.assignments?.[0]?.staffProfile?.name ??
                job?.assignments?.[0]?.freelancerProfile?.name;

              return (
                <div className="space-y-0.5 text-sm">
                  <p className="font-medium">{job?.title ?? "Unassigned job"}</p>
                  {client && (
                    <p className="text-xs text-muted-foreground">Client: {client}</p>
                  )}
                  {assignee && (
                    <p className="text-xs text-muted-foreground">With: {assignee}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Since {new Date(allocation.startDate).toLocaleDateString()}
                  </p>
                </div>
              );

            },

          },

          {

            key: "dailyRate",

            header: "Daily Rate",

            render: (row) =>

              row.dailyRate ? formatCurrency(row.dailyRate as number) : "—",

          },

          {

            key: "id",

            header: "Actions",

            render: (row) => {

              const allocation = (row.allocations as Array<{ id: string }>)[0];

              return (

                <div className="flex gap-2">

                  {allocation && (

                    <ReleaseAllocationButton allocationId={allocation.id} />

                  )}

                  <DeleteButton endpoint={`/api/equipment/${row.id as string}`} />

                </div>

              );

            },

          },

        ]}

      />

    </div>

  );

}

