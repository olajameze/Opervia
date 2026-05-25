"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePwa } from "@/components/pwa/PwaProvider";
import { OfflineMetaLine } from "@/components/pwa/OfflineBanner";
import {
  EquipmentForm,
  JobForm,
  LogisticsForm,
  StatusSelect,
  DeleteButton,
} from "@/components/app/ModuleForms";
import { formatDate } from "@/lib/utils";
import type { SyncSnapshot } from "@/lib/pwa/types";

const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "scheduling", label: "Scheduling" },
  { id: "rentals", label: "Rentals" },
  { id: "logistics", label: "Logistics" },
  { id: "notifications", label: "Alerts" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function DashboardPanel({ snapshot }: { snapshot: SyncSnapshot }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Active jobs</CardDescription>
          <CardTitle>{snapshot.stats.activeJobs}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Staff</CardDescription>
          <CardTitle>{snapshot.stats.staffCount}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Equipment out</CardDescription>
          <CardTitle>{snapshot.stats.equipmentRented}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Unassigned jobs</CardDescription>
          <CardTitle>{snapshot.stats.unassignedJobs}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

function SchedulingPanel({ snapshot }: { snapshot: SyncSnapshot }) {
  return (
    <div className="space-y-6">
      <JobForm projects={snapshot.projects.map((p) => ({ id: p.id, name: p.name }))} />
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>Cached scheduling data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs cached yet.</p>
          ) : (
            snapshot.jobs.map((job) => (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.project?.name ?? "No project"}
                    {job.scheduledAt ? ` · ${formatDate(new Date(job.scheduledAt))}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusSelect
                    endpoint={`/api/jobs/${job.id}`}
                    field="status"
                    value={job.status}
                    label={`Update status for ${job.title}`}
                    options={[
                      { value: "DRAFT", label: "Draft" },
                      { value: "SCHEDULED", label: "Scheduled" },
                      { value: "DISPATCHED", label: "Dispatched" },
                      { value: "IN_PROGRESS", label: "In progress" },
                      { value: "COMPLETED", label: "Completed" },
                      { value: "CANCELLED", label: "Cancelled" },
                    ]}
                  />
                  <DeleteButton endpoint={`/api/jobs/${job.id}`} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RentalsPanel({ snapshot }: { snapshot: SyncSnapshot }) {
  return (
    <div className="space-y-6">
      <EquipmentForm />
      <Card>
        <CardHeader>
          <CardTitle>Equipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.equipment.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0">
              <div>
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.category ?? "Uncategorised"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{item.status}</Badge>
                <DeleteButton endpoint={`/api/equipment/${item.id}`} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function LogisticsPanel({ snapshot }: { snapshot: SyncSnapshot }) {
  return (
    <div className="space-y-6">
      <LogisticsForm jobs={snapshot.jobs.map((job) => ({ id: job.id, title: job.title }))} />
      <Card>
        <CardHeader>
          <CardTitle>Logistics events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.logistics.map((event) => (
            <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0">
              <div>
                <p className="font-medium text-sm">{event.job?.title ?? "Job"}</p>
                <p className="text-xs text-muted-foreground">{event.location ?? "No location"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{event.status}</Badge>
                <DeleteButton endpoint={`/api/logistics/${event.id}`} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsPanel({ snapshot }: { snapshot: SyncSnapshot }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {snapshot.notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications cached.</p>
        ) : (
          snapshot.notifications.map((notification) => (
            <div key={notification.id} className="border-b pb-3 last:border-0">
              <p className="font-medium text-sm">{notification.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function OfflineAppShell() {
  const { snapshot, queueCount, refreshSnapshot } = usePwa();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("dashboard");

  useEffect(() => {
    void refreshSnapshot();
  }, [refreshSnapshot]);

  if (!snapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Offline mode</CardTitle>
          <CardDescription>
            No cached workspace data yet. Connect once while signed in, then Opervia will work offline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => router.refresh()}
          >
            Retry when back online
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Opervia offline</h1>
        <p className="text-sm text-muted-foreground">
          Continue field operations from cached data. Changes sync automatically when you reconnect.
        </p>
        <OfflineMetaLine />
        {queueCount > 0 && (
          <p className="text-sm text-amber-700">{queueCount} pending change{queueCount === 1 ? "" : "s"} queued.</p>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              tab === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardPanel snapshot={snapshot} />}
      {tab === "scheduling" && <SchedulingPanel snapshot={snapshot} />}
      {tab === "rentals" && <RentalsPanel snapshot={snapshot} />}
      {tab === "logistics" && <LogisticsPanel snapshot={snapshot} />}
      {tab === "notifications" && <NotificationsPanel snapshot={snapshot} />}
    </div>
  );
}
