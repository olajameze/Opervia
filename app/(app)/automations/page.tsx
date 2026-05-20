import { requireModuleAccess } from "@/lib/auth-helpers";

import { prisma } from "@/lib/db";

import { DataTable } from "@/components/app/DataTable";

import { Badge } from "@/components/ui/badge";

import { AutomationActions } from "@/components/app/AutomationActions";

import { WorkflowForm, WorkflowToggle, DeleteButton } from "@/components/app/ModuleForms";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";



export default async function AutomationsPage() {

  const { organization } = await requireModuleAccess("automations");



  const rules = await prisma.workflowRule.findMany({

    where: { organizationId: organization.id },

    orderBy: { createdAt: "asc" },

  });



  const notifications = await prisma.notification.findMany({

    where: { organizationId: organization.id },

    orderBy: { createdAt: "desc" },

    take: 10,

  });



  return (

    <div className="space-y-8">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

        <div>

          <h1 className="text-2xl font-bold">Workflow Automations</h1>

          <p className="text-muted-foreground">

            Define rules that trigger notifications when operational conditions are met.

          </p>

        </div>

        <AutomationActions />

      </div>



      <WorkflowForm />



      <DataTable

        data={rules}

        emptyMessage="No automation rules configured."

        columns={[

          { key: "name", header: "Rule" },

          { key: "trigger", header: "Trigger" },

          {

            key: "enabled",

            header: "Status",

            render: (row) => (

              <Badge variant={row.enabled ? "success" : "secondary"}>

                {row.enabled ? "Active" : "Disabled"}

              </Badge>

            ),

          },

          {

            key: "id",

            header: "Actions",

            render: (row) => (

              <div className="flex gap-2">

                <WorkflowToggle id={row.id as string} enabled={Boolean(row.enabled)} />

                <DeleteButton endpoint={`/api/workflows/${row.id as string}`} />

              </div>

            ),

          },

        ]}

      />



      <Card>

        <CardHeader>

          <CardTitle>Recent Notifications</CardTitle>

          <CardDescription>Triggered by automation rules</CardDescription>

        </CardHeader>

        <CardContent className="space-y-3">

          {notifications.length === 0 ? (

            <p className="text-sm text-muted-foreground">No notifications yet.</p>

          ) : (

            notifications.map((n) => (

              <div key={n.id} className="flex items-start justify-between py-2 border-b last:border-0">

                <div>

                  <p className="text-sm font-medium">{n.title}</p>

                  <p className="text-xs text-muted-foreground">{n.message}</p>

                </div>

                <Badge variant="outline">{n.type}</Badge>

              </div>

            ))

          )}

        </CardContent>

      </Card>

    </div>

  );

}

