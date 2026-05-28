import { requireModuleAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { DataTable } from "@/components/app/DataTable";
import { StatCard } from "@/components/app/StatCard";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { InvoiceForm, PaymentForm, StatusSelect } from "@/components/app/ModuleForms";
import { formatCurrency, formatDate } from "@/lib/utils";
import { hasActiveSubscription } from "@/lib/entitlements";
import { CreditCard, FileText, CheckCircle } from "lucide-react";

export default async function InvoicingPage() {
  const { organization } = await requireModuleAccess("invoicing");
  const canEdit = hasActiveSubscription(organization);

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
          <h1 className="text-2xl font-bold">Invoicing</h1>
          <p className="text-muted-foreground">
            Create invoices, record payments, and track outstanding balances.
          </p>
        </div>
        <LinkButton href="/billing" variant="outline" size="sm">
          Manage subscription
        </LinkButton>
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
              render: (row) => (row.invoice as { number: string } | null)?.number ?? "—",
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
