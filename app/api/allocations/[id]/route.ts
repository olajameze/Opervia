import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiOrganization } from "@/lib/api-auth";

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("rentals");
  if ("error" in ctx) return ctx.error;

  const allocation = await prisma.equipmentAllocation.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
    include: { equipment: true },
  });
  if (!allocation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (allocation.endDate) {
    return NextResponse.json({ error: "Allocation already released" }, { status: 400 });
  }

  const updated = await prisma.equipmentAllocation.update({
    where: { id: params.id },
    data: { endDate: new Date() },
  });

  const activeAllocation = await prisma.equipmentAllocation.findFirst({
    where: {
      equipmentId: allocation.equipmentId,
      organizationId: ctx.organizationId,
      endDate: null,
    },
  });

  if (!activeAllocation) {
    await prisma.equipment.update({
      where: { id: allocation.equipmentId },
      data: { status: "AVAILABLE" },
    });
  }

  return NextResponse.json(updated);
}
