import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { BRAND } from "@/lib/branding";
import { getAppUrl } from "@/lib/app-url";

export const EMAIL_VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function emailVerifyIdentifier(email: string) {
  return `email-verify:${email.trim().toLowerCase()}`;
}

export function getSignupNotifyEmail() {
  return (
    process.env.OPERVIA_SIGNUP_NOTIFY_EMAIL?.trim() ||
    process.env.RESEND_TEST_TO?.trim() ||
    BRAND.supportEmail
  );
}

function emailShell(title: string, bodyHtml: string) {
  return `<div style="font-family:Inter,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
  <p style="font-size:13px;color:#64748b;margin:0 0 24px;">${BRAND.name}</p>
  <h1 style="font-size:22px;margin:0 0 16px;">${title}</h1>
  ${bodyHtml}
  <p style="margin-top:32px;font-size:13px;color:#64748b;">Questions? Reply to ${BRAND.supportEmail}</p>
</div>`;
}

export async function createEmailVerificationToken(email: string) {
  const normalized = email.trim().toLowerCase();
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + EMAIL_VERIFY_TOKEN_TTL_MS);
  const identifier = emailVerifyIdentifier(normalized);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

export async function sendEmailVerificationEmail(input: {
  email: string;
  name: string;
  token: string;
}) {
  const appUrl = getAppUrl();
  const verifyUrl = `${appUrl}/verify-email?token=${input.token}`;
  const subject = `Confirm your ${BRAND.name} email`;

  return sendEmail({
    to: input.email,
    subject,
    text: `Hi ${input.name},\n\nConfirm your email to start using ${BRAND.name}:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    html: emailShell(
      "Confirm your email",
      `<p>Hi ${input.name},</p>
<p>Thanks for signing up for ${BRAND.name}. Confirm your email to activate your account and start your free trial.</p>
<p><a href="${verifyUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Confirm email</a></p>
<p style="color:#64748b;font-size:13px;">Or copy this link: ${verifyUrl}</p>
<p style="color:#64748b;font-size:13px;">This link expires in 24 hours.</p>`
    ),
    idempotencyKey: `email-verify/${input.email}/${input.token.slice(0, 8)}`,
  });
}

export async function sendWelcomeEmail(input: { email: string; name: string }) {
  const appUrl = getAppUrl();
  const dashboardUrl = `${appUrl}/dashboard`;
  const subject = `Welcome to ${BRAND.name}`;

  return sendEmail({
    to: input.email,
    subject,
    text: `Hi ${input.name},\n\nWelcome to ${BRAND.name}! Your email is confirmed.\n\nGet started: ${dashboardUrl}\n\n${BRAND.tagline}`,
    html: emailShell(
      `Welcome to ${BRAND.name}`,
      `<p>Hi ${input.name},</p>
<p>Your email is confirmed — welcome aboard. ${BRAND.name} helps you run rentals, workforce, scheduling, logistics, and billing from one place.</p>
<p><a href="${dashboardUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Go to dashboard</a></p>
<p style="color:#64748b;font-size:13px;">Your ${BRAND.trialDays}-day free trial starts after you complete secure checkout. A card is required but you won't be charged until the trial ends.</p>`
    ),
    idempotencyKey: `welcome/${input.email}`,
  });
}

export async function sendNewSignupAdminNotification(input: {
  email: string;
  name: string;
  method: "credentials" | "google";
}) {
  const appUrl = getAppUrl();
  const subject = `[${BRAND.name}] New signup: ${input.name}`;
  const methodLabel = input.method === "google" ? "Google" : "Email & password";

  return sendEmail({
    to: getSignupNotifyEmail(),
    subject,
    replyTo: input.email,
    text: `New ${BRAND.name} signup\n\nName: ${input.name}\nEmail: ${input.email}\nMethod: ${methodLabel}\n\nAdmin: ${appUrl}/super-admin`,
    html: emailShell(
      "New user signup",
      `<p>A new user signed up for ${BRAND.name}.</p>
<ul style="padding-left:20px;line-height:1.6;">
  <li><strong>Name:</strong> ${input.name}</li>
  <li><strong>Email:</strong> ${input.email}</li>
  <li><strong>Method:</strong> ${methodLabel}</li>
</ul>`
    ),
    idempotencyKey: `signup-notify/${input.email}`,
  });
}

export async function verifyEmailWithToken(token: string) {
  const record = await prisma.verificationToken.findFirst({
    where: { token },
  });

  if (!record || record.expires < new Date()) {
    return { ok: false as const, error: "Invalid or expired verification link" };
  }

  if (!record.identifier.startsWith("email-verify:")) {
    return { ok: false as const, error: "Invalid verification link" };
  }

  const email = record.identifier.slice("email-verify:".length);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { ok: false as const, error: "Account not found" };
  }

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  await prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } });

  const welcomeResult = await sendWelcomeEmail({
    email: user.email,
    name: user.name ?? user.email,
  });

  if (!welcomeResult.ok) {
    console.error(
      `[${BRAND.name}] Welcome email failed for ${user.email}: ${welcomeResult.error}`
    );
  }

  return { ok: true as const, email: user.email, name: user.name };
}

export async function sendSignupEmailsForNewUser(input: {
  userId: string;
  email: string;
  name: string;
  skipVerification?: boolean;
}) {
  const email = input.email.trim().toLowerCase();
  const results: { verification?: Awaited<ReturnType<typeof sendEmailVerificationEmail>>; admin: Awaited<ReturnType<typeof sendNewSignupAdminNotification>> } = {
    admin: await sendNewSignupAdminNotification({
      email,
      name: input.name,
      method: "credentials",
    }),
  };

  if (!input.skipVerification) {
    const token = await createEmailVerificationToken(email);
    results.verification = await sendEmailVerificationEmail({
      email,
      name: input.name,
      token,
    });

    if (results.verification.ok && results.verification.dev) {
      const appUrl = getAppUrl();
      console.log(
        `[${BRAND.name}] Email verification link for ${email}: ${appUrl}/verify-email?token=${token}`
      );
    }
  } else {
    const welcomeResult = await sendWelcomeEmail({ email, name: input.name });
    if (!welcomeResult.ok) {
      console.error(
        `[${BRAND.name}] Welcome email failed for ${email}: ${welcomeResult.error}`
      );
    }
  }

  if (!results.admin.ok) {
    console.error(
      `[${BRAND.name}] Signup admin notification failed for ${email}: ${results.admin.error}`
    );
  }

  if (results.verification && !results.verification.ok) {
    console.error(
      `[${BRAND.name}] Verification email failed for ${email}: ${results.verification.error}`
    );
  }

  return results;
}
