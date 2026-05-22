import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  category: z.string().optional(),
  dailyRate: z.coerce.number().optional(),
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE", "RETIRED"]).default("AVAILABLE"),
});

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("rentals");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "rentals.write");
  if (forbidden) return forbidden;

  try {
    const body = schema.parse(await req.json());
    const equipment = await prisma.equipment.create({
      data: {
        ...body,
        organizationId: ctx.organizationId,
      },
    });
    return NextResponse.json(equipment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid equipment data" }, { status: 400 });
  }
}
