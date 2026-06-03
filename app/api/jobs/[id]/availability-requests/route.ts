import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";
import { getEmailConfigError, sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/app-url";
import { BRAND } from "@/lib/branding";
import { formatDate } from "@/lib/utils";

const postSchema = z.object({
  freelancerIds: z.array(z.string()).min(1),
  requiredSkills: z.array(z.string()).optional(),
  message: z.string().optional(),
});

function formatJobDates(job: {
  startsAt: Date | null;
  endsAt: Date | null;
  scheduledAt: Date | null;
}): string {
  const start = job.startsAt ?? job.scheduledAt;
  const end = job.endsAt ?? start;
  if (!start) return "";
  if (!end || start.getTime() === end.getTime()) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("scheduling");
  if ("error" in ctx) return ctx.error;

  const job = await prisma.job.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const request = await prisma.availabilityRequest.findFirst({
    where: { jobId: job.id, organizationId: ctx.organizationId },
    orderBy: { sentAt: "desc" },
    include: {
      responses: {
        include: { freelancerProfile: true },
        orderBy: { respondedAt: "desc" },
      },
    },
  });

  return NextResponse.json({ request });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("scheduling");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "scheduling.write");
  if (forbidden) return forbidden;

  try {
    const body = postSchema.parse(await req.json());
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
    const dateLine = formatJobDates(job);

    const configError = getEmailConfigError();
    if (configError) {
      return NextResponse.json(
        {
          error: `Email is not configured (${configError}). Add RESEND_API_KEY and RESEND_FROM in Vercel environment variables.`,
        },
        { status: 503 }
      );
    }

    let emailed = 0;
    const failures: string[] = [];

    for (const freelancer of freelancers) {
      if (!freelancer.email) continue;
      const availableUrl = `${baseUrl}/availability/${token}?freelancerId=${freelancer.id}&intent=available`;
      const unavailableUrl = `${baseUrl}/availability/${token}?freelancerId=${freelancer.id}&intent=unavailable`;

      const result = await sendEmail({
        to: freelancer.email,
        subject: `${BRAND.name} availability request — ${job.title}`,
        text: [
          `Hello ${freelancer.name},`,
          "",
          `You have been asked about availability for:`,
          job.title,
          job.description ?? "",
          job.location ? `Location: ${job.location}` : "",
          dateLine ? `Date: ${dateLine}` : "",
          skillsLine,
          body.message ?? "",
          "",
          `I'm available: ${availableUrl}`,
          `Not available: ${unavailableUrl}`,
        ]
          .filter(Boolean)
          .join("\n"),
        html: `<p>Hello ${freelancer.name},</p>
          <p>You have been asked about availability for <strong>${job.title}</strong>.</p>
          ${job.description ? `<p>${job.description}</p>` : ""}
          ${job.location ? `<p><strong>Location:</strong> ${job.location}</p>` : ""}
          ${dateLine ? `<p><strong>Date:</strong> ${dateLine}</p>` : ""}
          ${skillsLine ? `<p>${skillsLine}</p>` : ""}
          ${body.message ? `<p>${body.message}</p>` : ""}
          <p style="margin-top:16px">
            <a href="${availableUrl}" style="display:inline-block;padding:10px 16px;margin-right:8px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px">I'm available</a>
            <a href="${unavailableUrl}" style="display:inline-block;padding:10px 16px;background:#fff;color:#111;text-decoration:none;border-radius:6px;border:1px solid #ccc">Not available</a>
          </p>`,
      });

      if (result.ok && !result.dev) {
        emailed++;
      } else if (result.ok && result.dev) {
        failures.push(`${freelancer.name}: email not sent (dev mode — configure Resend)`);
      } else {
        failures.push(`${freelancer.name}: ${result.error}`);
      }
    }

    if (emailed === 0) {
      return NextResponse.json(
        {
          error:
            failures[0] ??
            "No emails were sent. Check Resend configuration and freelancer email addresses.",
          request,
          emailed: 0,
          failures,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { request, emailed, failures: failures.length > 0 ? failures : undefined },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid availability request" }, { status: 400 });
  }
}
