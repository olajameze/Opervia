import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSuperAdminApi, isSuperAdminUser } from "@/lib/super-admin";

const schema = z.object({
  action: z.enum(["freeze", "unfreeze"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireSuperAdminApi();
  if ("error" in ctx) return ctx.error;

  try {
    const body = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if ((await isSuperAdminUser(user.id)) && body.action === "freeze") {
      return NextResponse.json({ error: "Cannot freeze super admin" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { frozenAt: body.action === "freeze" ? new Date() : null },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireSuperAdminApi();
  if ("error" in ctx) return ctx.error;

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (await isSuperAdminUser(user.id)) {
    return NextResponse.json({ error: "Cannot delete super admin" }, { status: 400 });
  }

  if (user.id === ctx.userId) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
