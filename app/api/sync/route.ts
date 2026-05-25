import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiOrganization } from "@/lib/api-auth";
import type { SyncSnapshot } from "@/lib/pwa/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireApiOrganization(undefined, { allowInactiveSubscription: true });
  if ("error" in ctx) return ctx.error;

  const organizationId = ctx.organizationId;

  const [
    jobs,
    shifts,
    projects,
    clients,
    staff,
    freelancers,
    assignments,
    equipment,
    allocations,
    logistics,
    notifications,
    activeJobs,
    staffCount,
    equipmentRented,
    unassignedJobs,
  ] = await Promise.all([
    prisma.job.findMany({
      where: { organizationId },
      orderBy: { scheduledAt: "asc" },
      include: {
        project: { select: { id: true, name: true } },
        assignments: {
          include: {
            staffProfile: { select: { id: true, name: true } },
            freelancerProfile: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.shift.findMany({
      where: { organizationId },
      orderBy: { startTime: "asc" },
      include: { staffProfile: { select: { id: true, name: true } } },
    }),
    prisma.project.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, clientId: true },
    }),
    prisma.client.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true },
    }),
    prisma.staffProfile.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, skills: true },
    }),
    prisma.freelancerProfile.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, skills: true },
    }),
    prisma.assignment.findMany({
      where: { organizationId },
      select: { id: true, jobId: true, staffProfileId: true, freelancerProfileId: true },
    }),
    prisma.equipment.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        status: true,
        dailyRate: true,
      },
    }),
    prisma.equipmentAllocation.findMany({
      where: { organizationId },
      orderBy: { startDate: "desc" },
      include: {
        equipment: { select: { id: true, name: true } },
        job: { select: { id: true, title: true } },
      },
    }),
    prisma.logisticsEvent.findMany({
      where: { organizationId },
      orderBy: { occurredAt: "desc" },
      include: { job: { select: { id: true, title: true } } },
    }),
    prisma.notification.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        read: true,
        createdAt: true,
      },
    }),
    prisma.job.count({
      where: {
        organizationId,
        status: { in: ["SCHEDULED", "DISPATCHED", "IN_PROGRESS"] },
      },
    }),
    prisma.staffProfile.count({ where: { organizationId } }),
    prisma.equipment.count({ where: { organizationId, status: "RENTED" } }),
    prisma.job.count({
      where: {
        organizationId,
        status: { in: ["SCHEDULED", "DISPATCHED"] },
        assignments: { none: {} },
      },
    }),
  ]);

  const snapshot: SyncSnapshot = {
    syncedAt: new Date().toISOString(),
    organizationId,
    jobs: jobs.map((job) => ({
      ...job,
      scheduledAt: job.scheduledAt?.toISOString() ?? null,
    })),
    shifts: shifts.map((shift) => ({
      id: shift.id,
      startTime: shift.startTime.toISOString(),
      endTime: shift.endTime.toISOString(),
      notes: shift.notes,
      staffProfile: shift.staffProfile,
    })),
    projects,
    clients,
    staff: staff.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      skills: member.skills.join(", "),
    })),
    freelancers: freelancers.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      skills: member.skills.join(", "),
    })),
    assignments,
    equipment: equipment.map((item) => ({
      ...item,
      dailyRate: item.dailyRate ? Number(item.dailyRate) : null,
    })),
    allocations: allocations.map((allocation) => ({
      id: allocation.id,
      equipmentId: allocation.equipmentId,
      jobId: allocation.jobId,
      startDate: allocation.startDate.toISOString(),
      endDate: allocation.endDate?.toISOString() ?? null,
      equipment: allocation.equipment,
      job: allocation.job,
    })),
    logistics: logistics.map((event) => ({
      id: event.id,
      jobId: event.jobId,
      status: event.status,
      location: event.location,
      notes: event.notes,
      job: event.job,
    })),
    notifications: notifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
    })),
    stats: {
      activeJobs,
      staffCount,
      equipmentRented,
      unassignedJobs,
    },
  };

  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}
