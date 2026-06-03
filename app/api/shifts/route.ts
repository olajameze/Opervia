import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  staffProfileId: z.string().min(1),
  jobId: z.string().optional(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("scheduling");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "scheduling.write");
  if (forbidden) return forbidden;

  try {
    const body = schema.parse(await req.json());

    if (body.jobId) {
      const job = await prisma.job.findFirst({
        where: { id: body.jobId, organizationId: ctx.organizationId },
      });
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
    }

    const shift = await prisma.$transaction(async (tx) => {
      const created = await tx.shift.create({
        data: {
          staffProfileId: body.staffProfileId,
          jobId: body.jobId || null,
          startTime: new Date(body.startTime),
          endTime: new Date(body.endTime),
          notes: body.notes,
          organizationId: ctx.organizationId,
        },
      });

      if (body.jobId) {
        const existing = await tx.assignment.findFirst({
          where: {
            jobId: body.jobId,
            staffProfileId: body.staffProfileId,
            organizationId: ctx.organizationId,
          },
        });
        if (!existing) {
          await tx.assignment.create({
            data: {
              jobId: body.jobId,
              staffProfileId: body.staffProfileId,
              organizationId: ctx.organizationId,
            },
          });
          const job = await tx.job.findFirst({ where: { id: body.jobId } });
          if (job && (job.status === "DRAFT" || job.status === "SCHEDULED")) {
            await tx.job.update({
              where: { id: body.jobId },
              data: { status: "DISPATCHED" },
            });
          }
        }
      }

      return created;
    });

    return NextResponse.json(shift, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid shift data" }, { status: 400 });
  }
}
