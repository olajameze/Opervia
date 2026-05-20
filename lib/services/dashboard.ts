import { prisma } from "@/lib/db";

export async function getDashboardStats(organizationId: string) {
  const [
    activeJobs,
    staffCount,
    equipmentRented,
    totalRevenue,
    pendingInvoices,
    unassignedJobs,
  ] = await Promise.all([
    prisma.job.count({
      where: {
        organizationId,
        status: { in: ["SCHEDULED", "DISPATCHED", "IN_PROGRESS"] },
      },
    }),
    prisma.staffProfile.count({ where: { organizationId } }),
    prisma.equipment.count({
      where: { organizationId, status: "RENTED" },
    }),
    prisma.payment.aggregate({
      where: { organizationId, status: "SUCCEEDED" },
      _sum: { amount: true },
    }),
    prisma.invoice.count({
      where: { organizationId, status: { in: ["SENT", "OVERDUE"] } },
    }),
    prisma.job.count({
      where: {
        organizationId,
        status: { in: ["SCHEDULED", "DISPATCHED"] },
        assignments: { none: {} },
      },
    }),
  ]);

  return {
    activeJobs,
    staffCount,
    equipmentRented,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    pendingInvoices,
    unassignedJobs,
  };
}
