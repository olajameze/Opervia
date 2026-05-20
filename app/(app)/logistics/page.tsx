import { requireModuleAccess } from "@/lib/auth-helpers";

import { prisma } from "@/lib/db";

import { DataTable } from "@/components/app/DataTable";

import { StatCard } from "@/components/app/StatCard";

import { Badge } from "@/components/ui/badge";

import { LogisticsForm, DeleteButton } from "@/components/app/ModuleForms";

import { Truck, MapPin, AlertTriangle } from "lucide-react";

import { formatDate } from "@/lib/utils";



const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {

  PLANNED: "outline",

  DISPATCHED: "secondary",

  IN_TRANSIT: "default",

  DELIVERED: "success",

  COMPLETED: "success",

  DELAYED: "destructive",

};



export default async function LogisticsPage() {

  const { organization } = await requireModuleAccess("logistics");



  const [events, jobs] = await Promise.all([

    prisma.logisticsEvent.findMany({

      where: { organizationId: organization.id },

      orderBy: { occurredAt: "desc" },

      include: { job: true },

    }),

    prisma.job.findMany({

      where: { organizationId: organization.id },

      orderBy: { title: "asc" },

    }),

  ]);



  const inTransit = events.filter((e) => e.status === "IN_TRANSIT").length;

  const delayed = events.filter((e) => e.status === "DELAYED").length;

  const completed = events.filter((e) => e.status === "COMPLETED").length;



  return (

    <div className="space-y-8">

      <div>

        <h1 className="text-2xl font-bold">Logistics</h1>

        <p className="text-muted-foreground">

          Track deliveries, routes, and operational milestones in real time.

        </p>

      </div>



      {jobs.length > 0 && (

        <LogisticsForm jobs={jobs.map((j) => ({ id: j.id, title: j.title }))} />

      )}



      <div className="grid gap-4 sm:grid-cols-3">

        <StatCard title="In Transit" value={inTransit} icon={Truck} />

        <StatCard title="Delayed" value={delayed} icon={AlertTriangle} />

        <StatCard title="Completed" value={completed} icon={MapPin} />

      </div>



      <DataTable

        data={events}

        emptyMessage="No logistics events tracked yet."

        columns={[

          {

            key: "job",

            header: "Job",

            render: (row) => (row.job as { title: string }).title,

          },

          {

            key: "status",

            header: "Status",

            render: (row) => (

              <Badge variant={statusVariant[String(row.status)] ?? "outline"}>

                {String(row.status)}

              </Badge>

            ),

          },

          { key: "location", header: "Location" },

          {

            key: "occurredAt",

            header: "Time",

            render: (row) => formatDate(row.occurredAt as Date),

          },

          { key: "notes", header: "Notes" },

          {

            key: "id",

            header: "Actions",

            render: (row) => (

              <DeleteButton endpoint={`/api/logistics/${row.id as string}`} />

            ),

          },

        ]}

      />

    </div>

  );

}

