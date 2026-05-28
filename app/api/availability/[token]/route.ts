import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  freelancerId: z.string().min(1),
  status: z.enum(["AVAILABLE", "UNAVAILABLE"]),
});

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const body = schema.parse(await req.json());
    const request = await prisma.availabilityRequest.findUnique({
      where: { token: params.token },
    });

    if (!request || request.expiresAt < new Date()) {
      return NextResponse.json({ error: "Request expired or not found" }, { status: 404 });
    }

    const freelancer = await prisma.freelancerProfile.findFirst({
      where: {
        id: body.freelancerId,
        organizationId: request.organizationId,
      },
    });
    if (!freelancer) {
      return NextResponse.json({ error: "Freelancer not found" }, { status: 404 });
    }

    const response = await prisma.availabilityResponse.upsert({
      where: {
        requestId_freelancerProfileId: {
          requestId: request.id,
          freelancerProfileId: freelancer.id,
        },
      },
      create: {
        requestId: request.id,
        freelancerProfileId: freelancer.id,
        status: body.status,
      },
      update: {
        status: body.status,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Invalid response" }, { status: 400 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const request = await prisma.availabilityRequest.findUnique({
    where: { token: params.token },
    include: {
      job: true,
      responses: { include: { freelancerProfile: true } },
    },
  });

  if (!request || request.expiresAt < new Date()) {
    return NextResponse.json({ error: "Request expired or not found" }, { status: 404 });
  }

  return NextResponse.json(request);
}
