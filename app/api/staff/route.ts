import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertStaffCapacity, requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  skills: z.string().optional(),
  hourlyRate: z.coerce.number().optional(),
});

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("workforce");
  if ("error" in ctx) return ctx.error;

  const limitError = await assertStaffCapacity(ctx.organizationId);
  if (limitError) return limitError;

  try {
    const body = schema.parse(await req.json());
    const staff = await prisma.staffProfile.create({
      data: {
        name: body.name,
        email: body.email || null,
        skills: body.skills ? body.skills.split(",").map((s) => s.trim()) : [],
        hourlyRate: body.hourlyRate,
        organizationId: ctx.organizationId,
      },
    });
    return NextResponse.json(staff, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid staff data" }, { status: 400 });
  }
}
