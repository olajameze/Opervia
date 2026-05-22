import { BRAND } from "@/lib/branding";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  idempotencyKey?: string;
};

export type SendEmailResult =
  | { ok: true; id?: string; dev?: boolean }
  | { ok: false; error: string };

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim());
}

/** Warn at startup when production is missing email configuration. */
export function validateProductionEmailConfig() {
  if (!isProductionRuntime()) return;

  const missing: string[] = [];
  if (!process.env.RESEND_API_KEY?.trim()) missing.push("RESEND_API_KEY");
  if (!process.env.RESEND_FROM?.trim()) missing.push("RESEND_FROM");

  if (missing.length > 0) {
    const message = `[${BRAND.name}] Production email misconfigured — missing: ${missing.join(", ")}`;
    console.error(message);
    throw new Error(message);
  }
}

export function getEmailConfigError(): string | null {
  if (!process.env.RESEND_API_KEY?.trim()) return "RESEND_API_KEY is not set";
  if (!process.env.RESEND_FROM?.trim()) return "RESEND_FROM is not set";
  return null;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const configError = getEmailConfigError();

  if (configError) {
    const payload = {
      to: input.to,
      subject: input.subject,
      text: input.text,
    };

    if (isProductionRuntime()) {
      console.error(`[${BRAND.name}] Email send blocked in production: ${configError}`, payload);
      return { ok: false, error: configError };
    }

    console.log(`[${BRAND.name}] Email (dev — ${configError})`, payload);
    return { ok: true, dev: true };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  };

  if (input.idempotencyKey) {
    headers["Idempotency-Key"] = input.idempotencyKey;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: process.env.RESEND_FROM,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
      reply_to: input.replyTo,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };

  if (!response.ok) {
    const error = body.message ?? `Resend API error (${response.status})`;
    console.error(`[${BRAND.name}] Email send failed`, { error, subject: input.subject });
    return { ok: false, error };
  }

  return { ok: true, id: body.id };
}

export function requireEmailForTransactional(context: string): Extract<SendEmailResult, { ok: false }> | null {
  const configError = getEmailConfigError();
  if (!configError) return null;

  if (isProductionRuntime()) {
    console.error(`[${BRAND.name}] ${context} blocked: ${configError}`);
    return { ok: false, error: `${context} unavailable: ${configError}` };
  }

  return null;
}
