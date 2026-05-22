import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE", "RETIRED"]),
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
      data: { status: body.status },
    });
    return NextResponse.json(equipment);
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
