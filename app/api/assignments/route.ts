import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  jobId: z.string().min(1),
  staffProfileId: z.string().optional(),
  freelancerProfileId: z.string().optional(),
});

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("scheduling");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "scheduling.write");
  if (forbidden) return forbidden;

  try {
    const body = schema.parse(await req.json());
    if (!body.staffProfileId && !body.freelancerProfileId) {
      return NextResponse.json(
        { error: "Assign a staff member or freelancer" },
        { status: 400 }
      );
    }

    const job = await prisma.job.findFirst({
      where: { id: body.jobId, organizationId: ctx.organizationId },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        jobId: body.jobId,
        staffProfileId: body.staffProfileId || null,
        freelancerProfileId: body.freelancerProfileId || null,
        organizationId: ctx.organizationId,
      },
    });

    if (job.status === "DRAFT" || job.status === "SCHEDULED") {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "DISPATCHED" },
      });
    }

    return NextResponse.json(assignment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid assignment data" }, { status: 400 });
  }
}
