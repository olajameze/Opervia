import { NextResponse } from "next/server";
import { z } from "zod";
import { BRAND } from "@/lib/branding";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  company: z.string().trim().max(160).optional().nullable(),
  phone: z.string().trim().max(60).optional().nullable(),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
});

export async function POST(req: Request) {
  let payload: z.infer<typeof schema>;
  try {
    payload = schema.parse(await req.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Invalid submission" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const submittedAt = new Date().toISOString();

  console.log(`[${BRAND.name}] Contact inquiry`, {
    submittedAt,
    name: payload.name,
    email: payload.email,
    company: payload.company ?? null,
    phone: payload.phone ?? null,
    subject: payload.subject,
    message: payload.message,
  });

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? `${BRAND.name} <no-reply@opervia.com>`,
          to: [BRAND.salesEmail],
          reply_to: payload.email,
          subject: `[${BRAND.name} contact] ${payload.subject}`,
          text: [
            `From: ${payload.name} <${payload.email}>`,
            payload.company ? `Company: ${payload.company}` : null,
            payload.phone ? `Phone: ${payload.phone}` : null,
            "",
            payload.message,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });
    } catch (err) {
      console.error(`[${BRAND.name}] Failed to send contact email via Resend`, err);
    }
  }

  return NextResponse.json({ ok: true });
}
