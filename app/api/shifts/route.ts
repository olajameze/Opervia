import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  staffProfileId: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("scheduling");
  if ("error" in ctx) return ctx.error;

  try {
    const body = schema.parse(await req.json());
    const shift = await prisma.shift.create({
      data: {
        staffProfileId: body.staffProfileId,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        notes: body.notes,
        organizationId: ctx.organizationId,
      },
    });
    return NextResponse.json(shift, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid shift data" }, { status: 400 });
  }
}
