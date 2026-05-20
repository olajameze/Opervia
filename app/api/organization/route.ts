import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiOrganization } from "@/lib/api-auth";
import { slugify } from "@/lib/services/organization";

const schema = z.object({
  name: z.string().min(2),
});

export async function PATCH(req: Request) {
  const ctx = await requireApiOrganization();
  if ("error" in ctx) return ctx.error;

  try {
    const body = schema.parse(await req.json());
    const organization = await prisma.organization.update({
      where: { id: ctx.organizationId },
      data: {
        name: body.name,
        slug: slugify(body.name),
      },
    });
    return NextResponse.json(organization);
  } catch {
    return NextResponse.json({ error: "Invalid organization data" }, { status: 400 });
  }
}
