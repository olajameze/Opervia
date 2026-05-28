import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";

function parseSkills(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map((s) => s.trim()).filter(Boolean);
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  skills: z.union([z.string(), z.array(z.string())]).optional(),
  dayRate: z.coerce.number().optional().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("workforce");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "workforce.write");
  if (forbidden) return forbidden;

  try {
    const body = patchSchema.parse(await req.json());
    const existing = await prisma.freelancerProfile.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const skills = parseSkills(body.skills);
    const freelancer = await prisma.freelancerProfile.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.location !== undefined && { location: body.location || null }),
        ...(skills !== undefined && { skills }),
        ...(body.dayRate !== undefined && { dayRate: body.dayRate }),
      },
    });
    return NextResponse.json(freelancer);
  } catch {
    return NextResponse.json({ error: "Invalid freelancer update" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("workforce");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "workforce.delete");
  if (forbidden) return forbidden;

  const existing = await prisma.freelancerProfile.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.freelancerProfile.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
