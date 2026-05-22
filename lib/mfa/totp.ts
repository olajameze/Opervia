import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { BRAND } from "@/lib/branding";

export function generateTotpSecret() {
  return generateSecret();
}

export function buildTotpAuthUri(email: string, secret: string) {
  return generateURI({
    issuer: BRAND.name,
    label: email,
    secret,
  });
}

export async function buildTotpQrDataUrl(email: string, secret: string) {
  return QRCode.toDataURL(buildTotpAuthUri(email, secret));
}

export function verifyTotpCode(secret: string, code: string) {
  return verifySync({ secret, token: code.trim() }).valid;
}

export function mfaSetupIdentifier(userId: string) {
  return `mfa-setup:${userId}`;
}
