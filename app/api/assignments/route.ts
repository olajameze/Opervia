import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";
import {
  createFreelancerAssignment,
  createStaffAssignment,
} from "@/lib/services/assignments";

const schema = z.object({
  jobId: z.string().min(1),
  staffProfileId: z.string().optional(),
  freelancerProfileId: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
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

    let assignment;
    if (body.freelancerProfileId) {
      assignment = await createFreelancerAssignment({
        jobId: body.jobId,
        freelancerProfileId: body.freelancerProfileId,
        organizationId: ctx.organizationId,
        startTime: body.startTime ? new Date(body.startTime) : null,
        endTime: body.endTime ? new Date(body.endTime) : null,
      });
    } else if (body.staffProfileId) {
      assignment = await createStaffAssignment({
        jobId: body.jobId,
        staffProfileId: body.staffProfileId,
        organizationId: ctx.organizationId,
      });
    } else {
      return NextResponse.json(
        { error: "Assign a staff member or freelancer" },
        { status: 400 }
      );
    }

    return NextResponse.json(assignment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid assignment data" }, { status: 400 });
  }
}
