import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiOrganization } from "@/lib/api-auth";

export async function GET() {
  const ctx = await requireApiOrganization();
  if ("error" in ctx) return ctx.error;

  const notifications = await prisma.notification.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ notifications });
}

const patchSchema = z.union([
  z.object({ id: z.string().min(1) }),
  z.object({ markAll: z.literal(true) }),
]);

export async function PATCH(req: Request) {
  const ctx = await requireApiOrganization();
  if ("error" in ctx) return ctx.error;

  try {
    const body = patchSchema.parse(await req.json());

    if ("markAll" in body) {
      await prisma.notification.updateMany({
        where: { organizationId: ctx.organizationId, read: false },
        data: { read: true },
      });
      return NextResponse.json({ ok: true });
    }

    const existing = await prisma.notification.findFirst({
      where: { id: body.id, organizationId: ctx.organizationId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.notification.update({
      where: { id: body.id },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid notification update" }, { status: 400 });
  }
}
