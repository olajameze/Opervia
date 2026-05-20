import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  name: z.string().min(1),
  trigger: z.enum([
    "JOB_UNASSIGNED",
    "EQUIPMENT_LOW",
    "INVOICE_OVERDUE",
    "LOGISTICS_DELAYED",
    "SHIFT_CONFLICT",
  ]),
});

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("automations");
  if ("error" in ctx) return ctx.error;

  try {
    const body = schema.parse(await req.json());
    const rule = await prisma.workflowRule.create({
      data: {
        name: body.name,
        trigger: body.trigger,
        organizationId: ctx.organizationId,
      },
    });
    return NextResponse.json(rule, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid workflow data" }, { status: 400 });
  }
}
