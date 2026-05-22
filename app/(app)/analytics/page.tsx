import { requireModuleAccess } from "@/lib/auth-helpers";
import { getDashboardStats } from "@/lib/services/dashboard";
import {
  getJobCompletionByMonth,
  getJobCompletionSummary,
  getRevenueByMonth,
} from "@/lib/services/analytics";
import { prisma } from "@/lib/db";
import { StatCard } from "@/components/app/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  CompletionDonut,
  JobCompletionChart,
} from "@/components/analytics/AnalyticsCharts";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, Users, Package } from "lucide-react";

export default async function AnalyticsPage() {
  const { organization } = await requireModuleAccess("analytics");
  const stats = await getDashboardStats(organization.id);

  const [revenueByMonth, jobCompletionByMonth, jobSummary, jobsByStatus, equipmentByStatus] =
    await Promise.all([
      getRevenueByMonth(organization.id),
      getJobCompletionByMonth(organization.id),
      getJobCompletionSummary(organization.id),
      prisma.job.groupBy({
        by: ["status"],
        where: { organizationId: organization.id },
        _count: true,
      }),
      prisma.equipment.groupBy({
        by: ["status"],
        where: { organizationId: organization.id },
        _count: true,
      }),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Operational KPIs and performance insights.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} />
        <StatCard title="Active Jobs" value={stats.activeJobs} icon={BarChart3} />
        <StatCard title="Staff Count" value={stats.staffCount} icon={Users} />
        <StatCard
          title="Equipment Utilization"
          value={`${stats.equipmentRented} rented`}
          icon={Package}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue over time</CardTitle>
            <CardDescription>Successful payments by month (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByMonth.every((item) => item.value === 0) ? (
              <p className="text-sm text-muted-foreground">No payment data yet.</p>
            ) : (
              <BarChart
                data={revenueByMonth.map((item) => ({ label: item.label, value: item.value }))}
                valueFormatter={(value) => formatCurrency(value)}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job completion rate</CardTitle>
            <CardDescription>Completed jobs vs jobs created each month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CompletionDonut
              rate={jobSummary.completionRate}
              completed={jobSummary.completed}
              total={jobSummary.total}
            />
            {jobCompletionByMonth.every((item) => item.total === 0) ? (
              <p className="text-sm text-muted-foreground">No job history yet.</p>
            ) : (
              <JobCompletionChart data={jobCompletionByMonth} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jobs by status</CardTitle>
            <CardDescription>Distribution across job lifecycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobsByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No job data yet.</p>
            ) : (
              jobsByStatus.map((item) => (
                <div key={item.status} className="flex justify-between text-sm">
                  <span>{item.status}</span>
                  <span className="font-medium">{item._count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipment by status</CardTitle>
            <CardDescription>Inventory utilization breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {equipmentByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No equipment data yet.</p>
            ) : (
              equipmentByStatus.map((item) => (
                <div key={item.status} className="flex justify-between text-sm">
                  <span>{item.status}</span>
                  <span className="font-medium">{item._count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
