import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSuperAdminApi } from "@/lib/super-admin";

const schema = z.object({
  action: z.enum(["freeze", "unfreeze", "cancel_plan"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireSuperAdminApi();
  if ("error" in ctx) return ctx.error;

  try {
    const body = schema.parse(await req.json());
    const org = await prisma.organization.findUnique({ where: { id: params.id } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (body.action === "freeze") {
      const updated = await prisma.organization.update({
        where: { id: params.id },
        data: { frozenAt: new Date() },
      });
      return NextResponse.json(updated);
    }

    if (body.action === "unfreeze") {
      const updated = await prisma.organization.update({
        where: { id: params.id },
        data: { frozenAt: null },
      });
      return NextResponse.json(updated);
    }

    const updated = await prisma.organization.update({
      where: { id: params.id },
      data: {
        subscriptionStatus: "CANCELED",
        stripeSubscriptionId: null,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
