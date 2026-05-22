import { prisma } from "@/lib/db";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "2-digit",
  });
}

function lastMonths(count: number) {
  const keys: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

export async function getRevenueByMonth(organizationId: string, months = 6) {
  const keys = lastMonths(months);
  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1));
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: {
      organizationId,
      status: "SUCCEEDED",
      createdAt: { gte: start },
    },
    select: { amount: true, createdAt: true },
  });

  const totals = Object.fromEntries(keys.map((key) => [key, 0]));
  for (const payment of payments) {
    const key = monthKey(payment.createdAt);
    if (key in totals) totals[key] += payment.amount;
  }

  return keys.map((key) => ({
    key,
    label: monthLabel(key),
    value: Math.round(totals[key] * 100) / 100,
  }));
}

export async function getJobCompletionByMonth(organizationId: string, months = 6) {
  const keys = lastMonths(months);
  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1));
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const jobs = await prisma.job.findMany({
    where: {
      organizationId,
      createdAt: { gte: start },
    },
    select: { status: true, createdAt: true, completedAt: true },
  });

  const buckets = Object.fromEntries(
    keys.map((key) => [key, { completed: 0, total: 0 }])
  );

  for (const job of jobs) {
    const key = monthKey(job.createdAt);
    if (!(key in buckets)) continue;
    buckets[key].total += 1;
    if (job.status === "COMPLETED") buckets[key].completed += 1;
  }

  return keys.map((key) => {
    const { completed, total } = buckets[key];
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { key, label: monthLabel(key), completed, total, rate };
  });
}

export async function getJobCompletionSummary(organizationId: string) {
  const [completed, cancelled, active, total] = await Promise.all([
    prisma.job.count({ where: { organizationId, status: "COMPLETED" } }),
    prisma.job.count({ where: { organizationId, status: "CANCELLED" } }),
    prisma.job.count({
      where: {
        organizationId,
        status: { in: ["SCHEDULED", "DISPATCHED", "IN_PROGRESS", "DRAFT"] },
      },
    }),
    prisma.job.count({ where: { organizationId } }),
  ]);

  const closed = completed + cancelled;
  const completionRate = closed > 0 ? Math.round((completed / closed) * 100) : 0;

  return { completed, cancelled, active, total, completionRate };
}
