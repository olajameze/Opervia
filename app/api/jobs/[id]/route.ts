import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  status: z.enum([
    "DRAFT",
    "SCHEDULED",
    "DISPATCHED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("scheduling");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "scheduling.write");
  if (forbidden) return forbidden;

  try {
    const body = schema.parse(await req.json());
    const existing = await prisma.job.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const job = await prisma.job.update({
      where: { id: params.id },
      data: {
        status: body.status,
        completedAt: body.status === "COMPLETED" ? new Date() : existing.completedAt,
      },
    });
    return NextResponse.json(job);
  } catch {
    return NextResponse.json({ error: "Invalid job update" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("scheduling");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "scheduling.delete");
  if (forbidden) return forbidden;

  const existing = await prisma.job.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.job.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
