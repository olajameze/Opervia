import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";
import { syncEquipmentStatus } from "@/lib/services/equipment-inventory";

const schema = z.object({
  addQuantity: z.coerce.number().int().positive().optional(),
  name: z.string().min(1).optional(),
  sku: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  dailyRate: z.coerce.number().optional().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("rentals");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "rentals.write");
  if (forbidden) return forbidden;

  try {
    const body = schema.parse(await req.json());
    const existing = await prisma.equipment.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const equipment = await prisma.equipment.update({
      where: { id: params.id },
      data: {
        ...(body.addQuantity !== undefined && {
          totalQuantity: { increment: body.addQuantity },
        }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.sku !== undefined && { sku: body.sku }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.dailyRate !== undefined && { dailyRate: body.dailyRate }),
      },
    });

    await syncEquipmentStatus(equipment.id);
    const updated = await prisma.equipment.findUniqueOrThrow({ where: { id: equipment.id } });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid equipment update" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("rentals");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "rentals.delete");
  if (forbidden) return forbidden;

  const existing = await prisma.equipment.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.equipment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
