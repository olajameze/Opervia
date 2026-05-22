import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("workforce");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "workforce.delete");
  if (forbidden) return forbidden;

  const existing = await prisma.staffProfile.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.staffProfile.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
