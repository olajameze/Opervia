import { RegisterForm } from "@/components/auth/RegisterForm";
import { createMetadata } from "@/lib/seo";
import { HERO } from "@/lib/branding";
import { findValidInviteByToken } from "@/lib/invites";

export const metadata = createMetadata({
  title: HERO.primaryCta,
  path: "/register",
  noIndex: true,
});

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { invite?: string };
}) {
  const invite = searchParams.invite
    ? await findValidInviteByToken(searchParams.invite)
    : null;

  return (
    <RegisterForm
      inviteToken={searchParams.invite}
      invitedEmail={invite?.email}
      organizationName={invite?.organization.name}
    />
  );
}
