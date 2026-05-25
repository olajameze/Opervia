import { Role, type SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { BRAND } from "@/lib/branding";
import { PLANS } from "@/lib/plans";
import { getAppUrl } from "@/lib/app-url";

function emailShell(title: string, bodyHtml: string) {
  return `<div style="font-family:Inter,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
  <p style="font-size:13px;color:#64748b;margin:0 0 24px;">${BRAND.name}</p>
  <h1 style="font-size:22px;margin:0 0 16px;">${title}</h1>
  ${bodyHtml}
  <p style="margin-top:32px;font-size:13px;color:#64748b;">Questions? Reply to ${BRAND.supportEmail}</p>
</div>`;
}

export async function getOrganizationOwners(organizationId: string) {
  const memberships = await prisma.membership.findMany({
    where: { organizationId, role: Role.OWNER },
    include: { user: { select: { email: true, name: true } } },
  });

  return memberships.map((membership) => ({
    email: membership.user.email,
    name: membership.user.name ?? membership.user.email,
  }));
}

function planLabel(plan: SubscriptionPlan | null | undefined): string | undefined {
  if (!plan) return undefined;
  return PLANS[plan].name;
}

export async function sendSubscriptionCanceledEmail(input: {
  email: string;
  name: string;
  organizationName: string;
  plan?: SubscriptionPlan | null;
  idempotencyKey: string;
}) {
  const appUrl = getAppUrl();
  const billingUrl = `${appUrl}/billing`;
  const planName = planLabel(input.plan);
  const planLine = planName ? ` Your ${planName} subscription` : " Your subscription";

  return sendEmail({
    to: input.email,
    subject: `${BRAND.name} subscription canceled`,
    text: `Hi ${input.name},\n\nThis confirms that${planLine} for ${input.organizationName} has been canceled. You will not be charged again.\n\nYour workspace data remains available according to your current access. You can review billing or resubscribe here: ${billingUrl}\n\nIf you did not request this, contact ${BRAND.supportEmail}.`,
    html: emailShell(
      "Subscription canceled",
      `<p>Hi ${input.name},</p>
<p>This confirms that${planLine} for <strong>${input.organizationName}</strong> has been canceled. You will not be charged again.</p>
<p>Your workspace remains available according to your current access. You can review billing or resubscribe at any time.</p>
<p><a href="${billingUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Open billing</a></p>
<p style="color:#64748b;font-size:13px;">If you did not request this cancellation, contact us at ${BRAND.supportEmail}.</p>`
    ),
    idempotencyKey: input.idempotencyKey,
  });
}

export async function notifyOrganizationOwnersSubscriptionCanceled(input: {
  organizationId: string;
  organizationName: string;
  plan?: SubscriptionPlan | null;
  idempotencyKey: string;
}) {
  const owners = await getOrganizationOwners(input.organizationId);

  for (const owner of owners) {
    const result = await sendSubscriptionCanceledEmail({
      email: owner.email,
      name: owner.name,
      organizationName: input.organizationName,
      plan: input.plan,
      idempotencyKey: `${input.idempotencyKey}/${owner.email}`,
    });

    if (!result.ok) {
      console.error(
        `[${BRAND.name}] Subscription canceled email failed for ${owner.email}: ${result.error}`
      );
    }
  }
}

export async function sendAccountDeletedEmail(input: {
  email: string;
  name: string;
  organizationName: string;
  idempotencyKey: string;
}) {
  const appUrl = getAppUrl();
  const registerUrl = `${appUrl}/register`;

  return sendEmail({
    to: input.email,
    subject: `${BRAND.name} account deleted`,
    text: `Hi ${input.name},\n\nThis confirms that the ${BRAND.name} workspace "${input.organizationName}" and all associated data have been permanently deleted.\n\nAny active subscription has been canceled and you will not be charged again.\n\nIf you did not request this deletion, contact ${BRAND.supportEmail} immediately.\n\nYou can create a new workspace at ${registerUrl}.`,
    html: emailShell(
      "Account deleted",
      `<p>Hi ${input.name},</p>
<p>This confirms that your <strong>${input.organizationName}</strong> workspace and all associated data have been permanently deleted from ${BRAND.name}.</p>
<p>Any active subscription linked to this workspace has been canceled. You will not be charged again.</p>
<p style="color:#64748b;font-size:13px;">If you did not request this deletion, contact us immediately at ${BRAND.supportEmail}.</p>
<p><a href="${registerUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Create a new workspace</a></p>`
    ),
    idempotencyKey: input.idempotencyKey,
  });
}

export async function notifyAccountDeleted(input: {
  organizationName: string;
  recipients: Array<{ email: string; name: string }>;
  idempotencyKey: string;
}) {
  for (const recipient of input.recipients) {
    const result = await sendAccountDeletedEmail({
      email: recipient.email,
      name: recipient.name,
      organizationName: input.organizationName,
      idempotencyKey: `${input.idempotencyKey}/${recipient.email}`,
    });

    if (!result.ok) {
      console.error(
        `[${BRAND.name}] Account deleted email failed for ${recipient.email}: ${result.error}`
      );
    }
  }
}
