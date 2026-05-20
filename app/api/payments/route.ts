import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiOrganization } from "@/lib/api-auth";

const schema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive(),
});

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("billing");
  if ("error" in ctx) return ctx.error;

  try {
    const body = schema.parse(await req.json());

    const invoice = await prisma.invoice.findFirst({
      where: { id: body.invoiceId, organizationId: ctx.organizationId },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const payment = await prisma.payment.create({
      data: {
        amount: body.amount,
        currency: invoice.currency,
        status: "SUCCEEDED",
        invoiceId: invoice.id,
        organizationId: ctx.organizationId,
      },
    });

    const paidTotal = await prisma.payment.aggregate({
      where: {
        invoiceId: invoice.id,
        status: "SUCCEEDED",
      },
      _sum: { amount: true },
    });

    if ((paidTotal._sum.amount ?? 0) >= invoice.amount) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAID" },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid payment data" }, { status: 400 });
  }
}
