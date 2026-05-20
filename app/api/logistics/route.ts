import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  jobId: z.string().min(1),
  status: z.enum(["PLANNED", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "COMPLETED", "DELAYED"]).default("PLANNED"),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("logistics");
  if ("error" in ctx) return ctx.error;

  try {
    const body = schema.parse(await req.json());
    const event = await prisma.logisticsEvent.create({
      data: {
        jobId: body.jobId,
        status: body.status,
        location: body.location,
        notes: body.notes,
        organizationId: ctx.organizationId,
      },
    });
    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid logistics data" }, { status: 400 });
  }
}
