import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";
import { getSkillCatalog, ensureDefaultSkills } from "@/lib/services/skills";

const createSchema = z.object({
  name: z.string().min(1).max(80),
});

export async function GET() {
  const ctx = await requireApiOrganization("workforce");
  if ("error" in ctx) return ctx.error;

  await ensureDefaultSkills(ctx.organizationId);
  const skills = await prisma.skillCatalog.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(skills);
}

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("workforce");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "workforce.write");
  if (forbidden) return forbidden;

  try {
    const body = createSchema.parse(await req.json());
    await ensureDefaultSkills(ctx.organizationId);
    const skill = await prisma.skillCatalog.create({
      data: { name: body.name.trim(), organizationId: ctx.organizationId },
    });
    return NextResponse.json(skill, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Skill already exists or invalid name" }, { status: 400 });
  }
}
