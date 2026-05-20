import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiOrganization } from "@/lib/api-auth";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("logistics");
  if ("error" in ctx) return ctx.error;

  const existing = await prisma.logisticsEvent.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.logisticsEvent.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
