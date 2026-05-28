import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";
import {
  normalizeEquipmentName,
  syncEquipmentStatus,
} from "@/lib/services/equipment-inventory";

const schema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  category: z.string().optional(),
  dailyRate: z.coerce.number().optional(),
  totalQuantity: z.coerce.number().int().positive().default(1),
});

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("rentals");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "rentals.write");
  if (forbidden) return forbidden;

  try {
    const body = schema.parse(await req.json());
    const normalized = normalizeEquipmentName(body.name);

    const existingItems = await prisma.equipment.findMany({
      where: { organizationId: ctx.organizationId },
    });
    const match = existingItems.find((item) => normalizeEquipmentName(item.name) === normalized);

    if (match) {
      const equipment = await prisma.equipment.update({
        where: { id: match.id },
        data: {
          totalQuantity: { increment: body.totalQuantity },
          ...(body.sku && !match.sku && { sku: body.sku }),
          ...(body.category && !match.category && { category: body.category }),
          ...(body.dailyRate !== undefined && { dailyRate: body.dailyRate }),
        },
      });
      await syncEquipmentStatus(equipment.id);
      const updated = await prisma.equipment.findUniqueOrThrow({ where: { id: equipment.id } });
      return NextResponse.json(updated);
    }

    const equipment = await prisma.equipment.create({
      data: {
        name: body.name.trim(),
        sku: body.sku,
        category: body.category,
        dailyRate: body.dailyRate,
        totalQuantity: body.totalQuantity,
        status: "AVAILABLE",
        organizationId: ctx.organizationId,
      },
    });
    return NextResponse.json(equipment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid equipment data" }, { status: 400 });
  }
}
