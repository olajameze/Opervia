import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  number: z.string().min(1),
  amount: z.coerce.number().positive(),
  dueDate: z.string().optional(),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).default("DRAFT"),
});

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("billing");
  if ("error" in ctx) return ctx.error;

  try {
    const body = schema.parse(await req.json());
    const invoice = await prisma.invoice.create({
      data: {
        number: body.number,
        amount: body.amount,
        currency: "GBP",
        status: body.status,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        organizationId: ctx.organizationId,
      },
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid invoice data" }, { status: 400 });
  }
}
