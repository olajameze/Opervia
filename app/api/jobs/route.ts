import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";
import { resolveJobDates } from "@/lib/services/assignments";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  projectId: z.string().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "DISPATCHED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("DRAFT"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  scheduledAt: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("scheduling");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "scheduling.write");
  if (forbidden) return forbidden;

  try {
    const body = schema.parse(await req.json());
    const dates = resolveJobDates(body);
    const job = await prisma.job.create({
      data: {
        title: body.title,
        description: body.description,
        location: body.location,
        projectId: body.projectId || null,
        status: body.status,
        priority: body.priority,
        scheduledAt: dates.scheduledAt,
        startsAt: dates.startsAt,
        endsAt: dates.endsAt,
        organizationId: ctx.organizationId,
      },
    });
    return NextResponse.json(job, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid job data" }, { status: 400 });
  }
}
