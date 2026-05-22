import { getOrganizationContext } from "@/lib/auth-helpers";
import { getDashboardStats } from "@/lib/services/dashboard";
import { StatCard } from "@/components/app/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { formatCurrency } from "@/lib/utils";
import { BRAND } from "@/lib/branding";
import { getTrialDaysRemaining, hasActiveSubscription, isOnActiveTrial } from "@/lib/entitlements";
import { evaluateWorkflowRules } from "@/lib/workflows";
import {
  Briefcase,
  Users,
  Package,
  Euro,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const { session, organization } = await getOrganizationContext();
  const trialDaysRemaining = isOnActiveTrial(organization)
    ? getTrialDaysRemaining(organization)
    : null;

  if (hasActiveSubscription(organization)) {
    await evaluateWorkflowRules(organization.id);
  }

  const stats = await getDashboardStats(organization.id);

  const recentJobs = await prisma.job.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { project: true, assignments: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{session.user.name ? `, ${session.user.name}` : ""}. {BRAND.tagline}
        </p>
      </div>

      {isOnActiveTrial(organization) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-800 dark:bg-amber-950/30">
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Free trial active
              {trialDaysRemaining !== null &&
                ` · ${trialDaysRemaining} day${trialDaysRemaining === 1 ? "" : "s"} left`}
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200/90 mt-0.5">
              You have full Starter access plus previews of Logistics and Analytics. Automations
              require Pro; bulk CSV export requires Enterprise.
            </p>
          </div>
          <LinkButton href="/billing" size="sm" variant="outline" className="shrink-0 border-amber-300">
            View plans
          </LinkButton>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Active Jobs" value={stats.activeJobs} icon={Briefcase} />
        <StatCard title="Staff Members" value={stats.staffCount} icon={Users} />
        <StatCard title="Equipment Out" value={stats.equipmentRented} icon={Package} />
        <StatCard
          title="Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={Euro}
        />
        <StatCard title="Pending Invoices" value={stats.pendingInvoices} icon={FileText} />
        <StatCard
          title="Unassigned Jobs"
          value={stats.unassignedJobs}
          icon={AlertTriangle}
          description={stats.unassignedJobs > 0 ? "Needs attention" : "All assigned"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>Latest operational activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No jobs yet. Create your first job in Scheduling.
            </p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.project?.name ?? "No project"} · {job.assignments.length} assigned
                    </p>
                  </div>
                  <Badge variant="outline">{job.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
