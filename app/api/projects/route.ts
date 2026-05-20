import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  clientId: z.string().optional(),
});

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("scheduling");
  if ("error" in ctx) return ctx.error;

  try {
    const body = schema.parse(await req.json());
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        clientId: body.clientId || null,
        organizationId: ctx.organizationId,
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid project data" }, { status: 400 });
  }
}
