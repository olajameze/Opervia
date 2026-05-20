import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("billing");
  if ("error" in ctx) return ctx.error;

  try {
    const body = schema.parse(await req.json());
    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: { status: body.status },
    });
    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json({ error: "Invalid invoice update" }, { status: 400 });
  }
}
