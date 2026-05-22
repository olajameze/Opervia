import { Resend } from "resend";

let cachedResend: Resend | null = null;
let cachedApiKey: string | null = null;

/** Clears the cached client — useful for tests and hot env reloads. */
export function resetResendClient() {
  cachedResend = null;
  cachedApiKey = null;
}

export function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  if (!cachedResend || cachedApiKey !== apiKey) {
    cachedResend = new Resend(apiKey);
    cachedApiKey = apiKey;
  }

  return cachedResend;
}
