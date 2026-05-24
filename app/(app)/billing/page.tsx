import { Suspense } from "react";
import { getOrganizationContext } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { DataTable } from "@/components/app/DataTable";
import { StatCard } from "@/components/app/StatCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingActions } from "@/components/app/BillingActions";
import { BillingStatusBanner } from "@/components/app/BillingStatusBanner";
import { InvoiceForm, PaymentForm, StatusSelect } from "@/components/app/ModuleForms";
import { BRAND } from "@/lib/branding";
import { getEffectivePlan, hasActiveSubscription, isOnActiveTrial, getTrialDaysRemaining } from "@/lib/entitlements";
import { PLANS } from "@/lib/plans";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, FileText, CheckCircle } from "lucide-react";



export default async function BillingPage() {

  const { organization } = await getOrganizationContext();

  const plan = getEffectivePlan(organization);
  const onTrial = isOnActiveTrial(organization);
  const canEdit = hasActiveSubscription(organization);
  const trialDays = onTrial ? getTrialDaysRemaining(organization) : null;



  const [invoices, payments] = await Promise.all([

    prisma.invoice.findMany({

      where: { organizationId: organization.id },

      orderBy: { createdAt: "desc" },

    }),

    prisma.payment.findMany({

      where: { organizationId: organization.id },

      orderBy: { createdAt: "desc" },

      include: { invoice: true },

    }),

  ]);



  const payableInvoices = invoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED");



  const totalPaid = payments

    .filter((p) => p.status === "SUCCEEDED")

    .reduce((sum, p) => sum + p.amount, 0);

  const outstanding = invoices

    .filter((i) => ["SENT", "OVERDUE"].includes(i.status))

    .reduce((sum, i) => sum + i.amount, 0);



  return (

    <div className="space-y-8">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

        <div>

          <h1 className="text-2xl font-bold">Billing</h1>

          <p className="text-muted-foreground">

            Manage your {BRAND.name} subscription, invoices, and payments.

          </p>

        </div>

        <BillingActions organization={organization} />
      </div>

      <Suspense fallback={null}>
        <BillingStatusBanner />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2">

        <Card>

          <CardHeader>

            <CardTitle>Current plan</CardTitle>
            <CardDescription>
              {onTrial
                ? `Free trial · ${trialDays} day${trialDays === 1 ? "" : "s"} remaining`
                : `${PLANS[plan].name} — ${PLANS[plan].priceLabel}${PLANS[plan].period}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!canEdit && (
              <p className="text-muted-foreground pb-1">
                Your trial has ended. Subscribe below to restore editing across {BRAND.name}.
                Invoice and payment history remains visible below.
              </p>
            )}
            {onTrial && (
              <p className="text-muted-foreground pb-1">
                Trial includes Starter features plus Logistics and Analytics previews. Subscribe
                to Pro for Automations, or Enterprise for bulk CSV export.
              </p>
            )}
            <div className="flex justify-between">

              <span className="text-muted-foreground">Status</span>

              <Badge>{organization.subscriptionStatus}</Badge>

            </div>

            <div className="flex justify-between">

              <span className="text-muted-foreground">Staff</span>

              <span>Up to {PLANS[plan].maxStaff}</span>

            </div>

            <div className="flex justify-between">

              <span className="text-muted-foreground">Freelancers</span>

              <span>Up to {PLANS[plan].maxFreelancers}</span>

            </div>

            {organization.trialEndsAt && organization.subscriptionStatus === "TRIALING" && (

              <div className="flex justify-between">

                <span className="text-muted-foreground">Trial ends</span>

                <span>{formatDate(organization.trialEndsAt)}</span>

              </div>

            )}

          </CardContent>

        </Card>



        <Card>

          <CardHeader>

            <CardTitle>Available plans</CardTitle>

            <CardDescription>All plans include a {BRAND.trialDays}-day free trial</CardDescription>

          </CardHeader>

          <CardContent className="space-y-3 text-sm">

            {Object.values(PLANS).map((item) => (

              <div key={item.id} className="flex justify-between border-b pb-2 last:border-0">

                <span className="font-medium">{item.name}</span>

                <span>

                  {item.priceLabel}

                  {item.period}

                </span>

              </div>

            ))}

          </CardContent>

        </Card>

      </div>



      {canEdit ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <InvoiceForm />
          <PaymentForm
            invoices={payableInvoices.map((i) => ({
              id: i.id,
              number: i.number,
              amount: i.amount,
            }))}
          />
        </div>
      ) : null}



      <div className="grid gap-4 sm:grid-cols-3">

        <StatCard title="Total Paid" value={formatCurrency(totalPaid)} icon={CheckCircle} />

        <StatCard title="Outstanding" value={formatCurrency(outstanding)} icon={FileText} />

        <StatCard title="Invoices" value={invoices.length} icon={CreditCard} />

      </div>



      <div className="space-y-4">

        <h2 className="text-lg font-semibold">Invoices</h2>

        <DataTable

          data={invoices}

          emptyMessage="No invoices yet."

          columns={[

            { key: "number", header: "Invoice #" },

            {

              key: "amount",

              header: "Amount",

              render: (row) => formatCurrency(row.amount as number, row.currency as string),

            },

            {

              key: "status",

              header: "Status",

              render: (row) =>
                canEdit ? (
                  <StatusSelect
                    endpoint={`/api/invoices/${row.id as string}`}
                    field="status"
                    label="Update invoice status"
                    value={String(row.status)}
                    options={[
                      { value: "DRAFT", label: "Draft" },
                      { value: "SENT", label: "Sent" },
                      { value: "PAID", label: "Paid" },
                      { value: "OVERDUE", label: "Overdue" },
                      { value: "CANCELLED", label: "Cancelled" },
                    ]}
                  />
                ) : (
                  <Badge variant="outline">{String(row.status)}</Badge>
                ),

            },

            {

              key: "dueDate",

              header: "Due",

              render: (row) => formatDate(row.dueDate as Date | null),

            },

          ]}

        />

      </div>



      <div className="space-y-4">

        <h2 className="text-lg font-semibold">Payments</h2>

        <DataTable

          data={payments}

          emptyMessage="No payments recorded yet."

          columns={[

            {

              key: "invoice",

              header: "Invoice",

              render: (row) =>

                (row.invoice as { number: string } | null)?.number ?? "—",

            },

            {

              key: "amount",

              header: "Amount",

              render: (row) => formatCurrency(row.amount as number, row.currency as string),

            },

            {

              key: "status",

              header: "Status",

              render: (row) => <Badge variant="outline">{String(row.status)}</Badge>,

            },

            {

              key: "createdAt",

              header: "Date",

              render: (row) => formatDate(row.createdAt as Date),

            },

          ]}

        />

      </div>

    </div>

  );

}

