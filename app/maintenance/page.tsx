import { requireSuperAdmin } from "@/lib/super-admin";
import { getSystemSettings } from "@/lib/system-settings";
import { createMetadata } from "@/lib/seo";
import { LinkButton } from "@/components/ui/link-button";
import { MaintenanceConsole } from "@/components/admin/MaintenanceConsole";
import { SuperAdminHeader } from "@/components/admin/SuperAdminHeader";
import { prisma } from "@/lib/db";
import { StatCard } from "@/components/app/StatCard";
import { Activity, Database, Server, Users } from "lucide-react";

export const metadata = createMetadata({
  title: "Maintenance Console",
  noIndex: true,
});

export default async function MaintenancePage() {
  await requireSuperAdmin();
  const settings = await getSystemSettings();

  const [userCount, orgCount, jobCount, recentAuditLogs, dbHealthy] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.job.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { email: true } } },
    }),
    prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`.then(() => true).catch(() => false),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SuperAdminHeader eyebrow="Developer" title="Maintenance Console">
        <LinkButton href="/super-admin" variant="outline" size="sm">
          Super Admin
        </LinkButton>
        <LinkButton href="/dashboard" variant="ghost" size="sm">
          App
        </LinkButton>
      </SuperAdminHeader>

      <main className="container mx-auto px-4 md:px-6 py-8 space-y-8">
        <MaintenanceConsole
          initialMaintenanceMode={settings.maintenanceMode}
          initialMessage={settings.maintenanceMessage ?? ""}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Users" value={userCount} icon={Users} />
          <StatCard title="Organizations" value={orgCount} icon={Database} />
          <StatCard title="Jobs" value={jobCount} icon={Activity} />
          <StatCard title="System" value={dbHealthy ? "Online" : "Degraded"} icon={Server} />
        </div>

        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold text-sm">Recent audit activity</h2>
            <p className="text-xs text-muted-foreground">
              Use this feed to spot operational issues and unexpected changes.
            </p>
          </div>
          <div className="divide-y">
            {recentAuditLogs.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No audit logs yet.</p>
            ) : (
              recentAuditLogs.map((log) => (
                <div key={log.id} className="px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <span className="font-medium">{log.action}</span>
                    <span className="text-muted-foreground"> · {log.entity}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {log.user?.email ?? "system"} · {log.createdAt.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
