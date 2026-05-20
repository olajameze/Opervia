import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import type { WorkflowTrigger } from "@prisma/client";

export async function evaluateWorkflowRules(organizationId: string) {
  const rules = await prisma.workflowRule.findMany({
    where: { organizationId, enabled: true },
  });

  for (const rule of rules) {
    await executeRule(organizationId, rule.trigger, rule.name);
  }
}

async function executeRule(
  organizationId: string,
  trigger: WorkflowTrigger,
  ruleName: string
) {
  switch (trigger) {
    case "JOB_UNASSIGNED": {
      const count = await prisma.job.count({
        where: {
          organizationId,
          status: { in: ["SCHEDULED", "DISPATCHED"] },
          assignments: { none: {} },
        },
      });
      if (count > 0) {
        await createNotification({
          organizationId,
          title: "Unassigned jobs detected",
          message: `${count} job(s) have no staff assigned. Rule: ${ruleName}`,
          type: "WARNING",
        });
      }
      break;
    }
    case "EQUIPMENT_LOW": {
      const available = await prisma.equipment.count({
        where: { organizationId, status: "AVAILABLE" },
      });
      const total = await prisma.equipment.count({ where: { organizationId } });
      if (total > 0 && available / total < 0.2) {
        await createNotification({
          organizationId,
          title: "Low equipment availability",
          message: `Only ${available} of ${total} items available. Rule: ${ruleName}`,
          type: "ALERT",
        });
      }
      break;
    }
    case "INVOICE_OVERDUE": {
      const overdue = await prisma.invoice.count({
        where: { organizationId, status: "OVERDUE" },
      });
      if (overdue > 0) {
        await createNotification({
          organizationId,
          title: "Overdue invoices",
          message: `${overdue} invoice(s) are overdue. Rule: ${ruleName}`,
          type: "WARNING",
        });
      }
      break;
    }
    case "LOGISTICS_DELAYED": {
      const delayed = await prisma.logisticsEvent.count({
        where: { organizationId, status: "DELAYED" },
      });
      if (delayed > 0) {
        await createNotification({
          organizationId,
          title: "Logistics delays",
          message: `${delayed} delivery event(s) are delayed. Rule: ${ruleName}`,
          type: "ALERT",
        });
      }
      break;
    }
    case "SHIFT_CONFLICT": {
      const shifts = await prisma.shift.findMany({
        where: { organizationId },
        orderBy: { startTime: "asc" },
      });
      let conflicts = 0;
      for (let i = 0; i < shifts.length; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
          if (shifts[i].staffProfileId !== shifts[j].staffProfileId) continue;
          if (shifts[i].startTime < shifts[j].endTime && shifts[j].startTime < shifts[i].endTime) {
            conflicts++;
          }
        }
      }
      if (conflicts > 0) {
        await createNotification({
          organizationId,
          title: "Shift conflicts detected",
          message: `${conflicts} overlapping shift(s) found. Rule: ${ruleName}`,
          type: "WARNING",
        });
      }
      break;
    }
    default:
      break;
  }
}
