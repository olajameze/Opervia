export const COOKIE_CONSENT_KEY = "opervia-cookie-consent";
export const COOKIE_CONSENT_EVENT = "opervia-cookie-consent-change";

export type CookieConsentChoice = "accepted" | "declined";

export function parseCookieConsent(value: string | null): CookieConsentChoice | null {
  if (value === "accepted" || value === "declined") return value;
  return null;
}
