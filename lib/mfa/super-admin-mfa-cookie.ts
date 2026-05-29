import { cookies } from "next/headers";

export const SUPER_ADMIN_MFA_COOKIE = "opervia-super-admin-mfa";
export const SUPER_ADMIN_MFA_TTL_SEC = 12 * 60 * 60;

type MfaCookiePayload = {
  uid: string;
  exp: number;
};

function getSigningSecret(): string | null {
  return process.env.AUTH_SECRET?.trim() || null;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signPayload(payloadStr: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadStr)
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifyPayload(payloadStr: string, signature: string, secret: string) {
  const key = await importHmacKey(secret);
  return crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signature) as BufferSource,
    new TextEncoder().encode(payloadStr)
  );
}

export function superAdminMfaCookieOptions() {
  return {
    name: SUPER_ADMIN_MFA_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SUPER_ADMIN_MFA_TTL_SEC,
  };
}

export async function createSuperAdminMfaCookieValue(userId: string): Promise<string | null> {
  const secret = getSigningSecret();
  if (!secret) return null;

  const payload: MfaCookiePayload = {
    uid: userId,
    exp: Math.floor(Date.now() / 1000) + SUPER_ADMIN_MFA_TTL_SEC,
  };
  const payloadStr = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const signature = await signPayload(payloadStr, secret);
  return `${payloadStr}.${signature}`;
}

export async function verifySuperAdminMfaCookieValue(
  userId: string,
  cookieValue: string | undefined | null
): Promise<boolean> {
  const secret = getSigningSecret();
  if (!secret || !cookieValue) return false;

  const [payloadStr, signature] = cookieValue.split(".");
  if (!payloadStr || !signature) return false;
  if (!(await verifyPayload(payloadStr, signature, secret))) return false;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payloadStr))
    ) as MfaCookiePayload;

    if (payload.uid !== userId) return false;
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function setSuperAdminMfaCookie(userId: string): Promise<boolean> {
  const value = await createSuperAdminMfaCookieValue(userId);
  if (!value) return false;

  const options = superAdminMfaCookieOptions();
  cookies().set(options.name, value, options);
  return true;
}

export async function clearSuperAdminMfaCookie() {
  cookies().delete(SUPER_ADMIN_MFA_COOKIE);
}

export async function isSuperAdminMfaCookieValid(userId: string): Promise<boolean> {
  const cookie = cookies().get(SUPER_ADMIN_MFA_COOKIE)?.value;
  return verifySuperAdminMfaCookieValue(userId, cookie);
}

export async function isSuperAdminMfaSatisfied(input: {
  userId: string;
  totpEnabled: boolean;
  jwtVerified: boolean;
  cookieValue?: string | null;
}): Promise<boolean> {
  if (!input.totpEnabled) return true;
  if (input.jwtVerified) return true;
  return verifySuperAdminMfaCookieValue(input.userId, input.cookieValue ?? null);
}
