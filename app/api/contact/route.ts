import { NextResponse } from "next/server";
import { z } from "zod";
import { BRAND } from "@/lib/branding";
import { sendEmail, requireEmailForTransactional } from "@/lib/email";
import { HONEYPOT_FIELD } from "@/lib/security/honeypot";
import { guardPublicForm } from "@/lib/security/public-form-guard";
import { ipAndIdentifierRateLimit } from "@/lib/security/rate-limit";
import { guardPublicAccessDuringMaintenance } from "@/lib/maintenance";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  company: z.string().trim().max(160).optional().nullable(),
  phone: z.string().trim().max(60).optional().nullable(),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
  [HONEYPOT_FIELD]: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  const maintenanceBlocked = await guardPublicAccessDuringMaintenance();
  if (maintenanceBlocked) return maintenanceBlocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const blocked = await guardPublicForm({
    req,
    action: "contact",
    body: (body ?? {}) as Record<string, unknown>,
    ipLimit: { limit: 8, windowMs: 60 * 60 * 1000 },
  });
  if (blocked) return blocked;

  let payload: z.infer<typeof schema>;
  try {
    payload = schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Invalid submission" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const rateLimited = ipAndIdentifierRateLimit(req, "contact", payload.email, {
    ip: { limit: 8, windowMs: 60 * 60 * 1000 },
    id: { limit: 3, windowMs: 60 * 60 * 1000 },
  });
  if (rateLimited) return rateLimited;

  const emailBlocked = requireEmailForTransactional("Contact form email");
  if (emailBlocked) {
    return NextResponse.json(
      { error: "Contact form is temporarily unavailable. Email support directly." },
      { status: 503 }
    );
  }

  const result = await sendEmail({
    to: BRAND.salesEmail,
    replyTo: payload.email,
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
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "We could not deliver your message. Please try again later." },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true });
}
