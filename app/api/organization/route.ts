import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";
import { createUniqueOrganizationSlug } from "@/lib/services/organization";

const schema = z.object({
  name: z.string().min(2),
});

export async function PATCH(req: Request) {
  const ctx = await requireApiOrganization();
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "organization.manage");
  if (forbidden) return forbidden;

  try {
    const body = schema.parse(await req.json());
    const slug = await createUniqueOrganizationSlug(body.name);
    const organization = await prisma.organization.update({
      where: { id: ctx.organizationId },
      data: {
        name: body.name,
        slug,
      },
    });
    return NextResponse.json(organization);
  } catch {
    return NextResponse.json({ error: "Invalid organization data" }, { status: 400 });
  }
}
