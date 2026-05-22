import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { findValidInviteByToken, normalizeInviteEmail } from "@/lib/invites";
import { formatRoleLabel } from "@/lib/roles";
import { AcceptInviteButton } from "@/components/app/AcceptInviteButton";
import { AuthBrandLockup } from "@/components/brand/AuthBrandLockup";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/branding";

export const metadata = createMetadata({
  title: "Accept Invite",
  path: "/invite",
  noIndex: true,
});

export default async function InvitePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  if (!token) {
    return (
      <InviteShell>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid invite link</CardTitle>
            <CardDescription>This invite link is missing a token.</CardDescription>
          </CardHeader>
        </Card>
      </InviteShell>
    );
  }

  const invite = await findValidInviteByToken(token);
  if (!invite) {
    return (
      <InviteShell>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invite expired</CardTitle>
            <CardDescription>
              Ask your workspace admin to send a new invite from {BRAND.name} Settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </InviteShell>
    );
  }

  const session = await auth();
  if (session?.user?.organizationId) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: invite.organizationId,
        },
      },
    });
    if (membership) redirect("/dashboard");
  }

  const userEmail = session?.user?.email ? normalizeInviteEmail(session.user.email) : null;
  const emailMatches = userEmail === invite.email;

  return (
    <InviteShell>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {invite.organization.name}</CardTitle>
          <CardDescription>
            {invite.invitedBy.name ?? invite.invitedBy.email} invited you to collaborate on{" "}
            {BRAND.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Workspace</span>
              <span className="font-medium text-right">{invite.organization.name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Invited email</span>
              <span className="font-medium text-right">{invite.email}</span>
            </div>
            <div className="flex justify-between gap-4 items-center">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary">{formatRoleLabel(invite.role)}</Badge>
            </div>
          </div>

          {!session?.user ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sign in or create an account with <strong>{invite.email}</strong> to accept.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <LinkButton href={`/login?callbackUrl=${encodeURIComponent(`/invite?token=${token}`)}`} className="flex-1">
                  Sign in
                </LinkButton>
                <LinkButton
                  href={`/register?invite=${token}`}
                  variant="outline"
                  className="flex-1"
                >
                  Create account
                </LinkButton>
              </div>
            </div>
          ) : emailMatches ? (
            <AcceptInviteButton token={token} />
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-destructive">
                You are signed in as {session.user.email}, but this invite was sent to{" "}
                {invite.email}.
              </p>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/invite?token=${token}`)}`}
                className="text-primary hover:underline"
              >
                Sign in with the invited email
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </InviteShell>
  );
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <AuthBrandLockup />
      {children}
    </div>
  );
}
