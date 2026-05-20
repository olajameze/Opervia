import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  enabled: z.boolean(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("automations");
  if ("error" in ctx) return ctx.error;

  try {
    const body = schema.parse(await req.json());
    const existing = await prisma.workflowRule.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rule = await prisma.workflowRule.update({
      where: { id: params.id },
      data: { enabled: body.enabled },
    });
    return NextResponse.json(rule);
  } catch {
    return NextResponse.json({ error: "Invalid workflow update" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("automations");
  if ("error" in ctx) return ctx.error;

  const existing = await prisma.workflowRule.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.workflowRule.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
