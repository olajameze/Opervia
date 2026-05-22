import { BRAND } from "@/lib/branding";
import { getResend } from "@/lib/resend-client";

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

function isPlaceholderResendApiKey(apiKey: string) {
  const normalized = apiKey.trim().toLowerCase();
  if (!normalized.startsWith("re_")) return false;
  return /^re_[x.*_\-]+$/.test(normalized);
}

function getResendApiKey() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || isPlaceholderResendApiKey(apiKey)) return null;
  return apiKey;
}

export function isEmailConfigured() {
  return Boolean(getResendApiKey() && process.env.RESEND_FROM?.trim());
}

/** Log production email misconfiguration without crashing the app. */
export function warnProductionEmailConfig() {
  if (!isProductionRuntime()) return;

  const missing: string[] = [];
  if (!getResendApiKey()) missing.push("RESEND_API_KEY");
  if (!process.env.RESEND_FROM?.trim()) missing.push("RESEND_FROM");

  if (missing.length > 0) {
    const message = `[${BRAND.name}] Production email misconfigured — missing: ${missing.join(", ")}`;
    console.error(message);
  }
}

/** Fail fast when production email env vars are missing (for tests/strict checks). */
export function validateProductionEmailConfig() {
  warnProductionEmailConfig();

  if (!isProductionRuntime()) return;

  const missing: string[] = [];
  if (!process.env.RESEND_API_KEY?.trim()) missing.push("RESEND_API_KEY");
  if (!process.env.RESEND_FROM?.trim()) missing.push("RESEND_FROM");

  if (missing.length > 0) {
    throw new Error(
      `[${BRAND.name}] Production email misconfigured — missing: ${missing.join(", ")}`
    );
  }
}

export function getEmailConfigError(): string | null {
  if (!getResendApiKey()) return "RESEND_API_KEY is not set";
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

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send(
      {
        from: process.env.RESEND_FROM!,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
        replyTo: input.replyTo,
      },
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined
    );

    if (error) {
      console.error(`[${BRAND.name}] Email send failed`, { error: error.message, subject: input.subject });
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resend send failed";
    console.error(`[${BRAND.name}] Email send failed`, { error: message, subject: input.subject });
    return { ok: false, error: message };
  }
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
