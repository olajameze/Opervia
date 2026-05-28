import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/app-url";
import { BRAND } from "@/lib/branding";
import { formatDate } from "@/lib/utils";

const schema = z.object({
  freelancerIds: z.array(z.string()).min(1),
  requiredSkills: z.array(z.string()).optional(),
  message: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("scheduling");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "scheduling.write");
  if (forbidden) return forbidden;

  try {
    const body = schema.parse(await req.json());
    const job = await prisma.job.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const freelancers = await prisma.freelancerProfile.findMany({
      where: {
        id: { in: body.freelancerIds },
        organizationId: ctx.organizationId,
        email: { not: null },
      },
    });

    if (freelancers.length === 0) {
      return NextResponse.json({ error: "No freelancers with email found" }, { status: 400 });
    }

    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const request = await prisma.availabilityRequest.create({
      data: {
        jobId: job.id,
        organizationId: ctx.organizationId,
        token,
        expiresAt,
        requiredSkills: body.requiredSkills ?? [],
        message: body.message ?? null,
      },
    });

    const baseUrl = getAppUrl();
    const skillsLine =
      body.requiredSkills && body.requiredSkills.length > 0
        ? `Skills requested: ${body.requiredSkills.join(", ")}`
        : "";

    for (const freelancer of freelancers) {
      if (!freelancer.email) continue;
      const respondUrl = `${baseUrl}/availability/${token}?freelancerId=${freelancer.id}`;
      await sendEmail({
        to: freelancer.email,
        subject: `${BRAND.name} availability request — ${job.title}`,
        text: [
          `Hello ${freelancer.name},`,
          "",
          `You have been asked about availability for:`,
          job.title,
          job.description ?? "",
          job.location ? `Location: ${job.location}` : "",
          job.scheduledAt ? `Date: ${formatDate(job.scheduledAt)}` : "",
          skillsLine,
          body.message ?? "",
          "",
          `Respond here: ${respondUrl}`,
        ]
          .filter(Boolean)
          .join("\n"),
        html: `<p>Hello ${freelancer.name},</p>
          <p>You have been asked about availability for <strong>${job.title}</strong>.</p>
          ${job.location ? `<p><strong>Location:</strong> ${job.location}</p>` : ""}
          ${job.scheduledAt ? `<p><strong>Date:</strong> ${formatDate(job.scheduledAt)}</p>` : ""}
          ${skillsLine ? `<p>${skillsLine}</p>` : ""}
          ${body.message ? `<p>${body.message}</p>` : ""}
          <p><a href="${respondUrl}">Respond to availability request</a></p>`,
      });
    }

    return NextResponse.json({ request, emailed: freelancers.length }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid availability request" }, { status: 400 });
  }
}
