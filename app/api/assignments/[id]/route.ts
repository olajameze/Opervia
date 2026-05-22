import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("scheduling");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "scheduling.delete");
  if (forbidden) return forbidden;

  const existing = await prisma.assignment.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.assignment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
