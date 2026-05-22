import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  equipmentId: z.string().min(1),
  jobId: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
});

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("rentals");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "rentals.write");
  if (forbidden) return forbidden;

  try {
    const body = schema.parse(await req.json());

    const equipment = await prisma.equipment.findFirst({
      where: { id: body.equipmentId, organizationId: ctx.organizationId },
    });
    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    const allocation = await prisma.equipmentAllocation.create({
      data: {
        equipmentId: body.equipmentId,
        jobId: body.jobId || null,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        organizationId: ctx.organizationId,
      },
    });

    await prisma.equipment.update({
      where: { id: body.equipmentId },
      data: { status: "RENTED" },
    });

    return NextResponse.json(allocation, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid allocation data" }, { status: 400 });
  }
}
