import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertFreelancerCapacity, denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";

function parseSkills(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((s) => s.trim()).filter(Boolean);
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  location: z.string().optional(),
  skills: z.union([z.string(), z.array(z.string())]).optional(),
  dayRate: z.coerce.number().optional(),
});

export async function GET(req: Request) {
  const ctx = await requireApiOrganization("workforce");
  if ("error" in ctx) return ctx.error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase();

  const freelancers = await prisma.freelancerProfile.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { name: "asc" },
    include: { documents: true },
  });

  if (!q) return NextResponse.json(freelancers);

  const filtered = freelancers.filter((person) => {
    const haystack = [
      person.name,
      person.email ?? "",
      person.phone ?? "",
      person.location ?? "",
      ...person.skills,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  return NextResponse.json(filtered);
}

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("workforce");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "workforce.write");
  if (forbidden) return forbidden;

  const limitError = await assertFreelancerCapacity(ctx.organizationId);
  if (limitError) return limitError;

  try {
    const body = createSchema.parse(await req.json());
    const freelancer = await prisma.freelancerProfile.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        location: body.location || null,
        skills: parseSkills(body.skills),
        dayRate: body.dayRate,
        organizationId: ctx.organizationId,
      },
    });
    return NextResponse.json(freelancer, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid freelancer data" }, { status: 400 });
  }
}
