import Link from "next/link";
import { requireSuperAdmin } from "@/lib/super-admin";
import { createMetadata } from "@/lib/seo";
import { LinkButton } from "@/components/ui/link-button";
import { AdminUserTable } from "@/components/admin/AdminUserTable";
import { prisma } from "@/lib/db";
import { StatCard } from "@/components/app/StatCard";
import { Users, Building2, AlertTriangle, CreditCard } from "lucide-react";

export const metadata = createMetadata({
  title: "Super Admin",
  noIndex: true,
});

export default async function SuperAdminPage() {
  await requireSuperAdmin();

  const [users, orgCount, pastDueCount, overdueInvoices] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        memberships: {
          include: { organization: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.organization.count(),
    prisma.organization.count({
      where: { subscriptionStatus: { in: ["PAST_DUE", "UNPAID"] } },
    }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
  ]);

  const rows = users.map((user) => {
    const org = user.memberships[0]?.organization;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      frozenAt: user.frozenAt?.toISOString() ?? null,
      isSuperAdmin: user.isSuperAdmin,
      organizationId: org?.id ?? null,
      organizationName: org?.name ?? null,
      subscriptionPlan: org?.subscriptionPlan ?? null,
      subscriptionStatus: org?.subscriptionStatus ?? null,
      orgFrozenAt: org?.frozenAt?.toISOString() ?? null,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Platform</p>
            <h1 className="text-lg font-bold">Super Admin</h1>
          </div>
          <div className="flex gap-2">
            <LinkButton href="/super-admin/security" variant="outline" size="sm">
              Security
            </LinkButton>
            <LinkButton href="/maintenance" variant="outline" size="sm">
              Maintenance Console
            </LinkButton>
            <LinkButton href="/dashboard" variant="ghost" size="sm">
              App
            </LinkButton>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-8 space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Users" value={users.length} icon={Users} />
          <StatCard title="Organizations" value={orgCount} icon={Building2} />
          <StatCard title="Past Due / Unpaid" value={pastDueCount} icon={AlertTriangle} />
          <StatCard title="Overdue Invoices" value={overdueInvoices} icon={CreditCard} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All users & subscriptions</h2>
            <Link href="/maintenance" className="text-sm text-primary hover:underline">
              Open maintenance console →
            </Link>
          </div>
          <AdminUserTable users={rows} />
        </div>
      </main>
    </div>
  );
}
