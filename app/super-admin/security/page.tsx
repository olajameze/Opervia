import Link from "next/link";
import { SuperAdminSecurityPanel } from "@/components/admin/SuperAdminSecurityPanel";
import { requireSuperAdmin } from "@/lib/super-admin";
import { createMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/branding";
import { LinkButton } from "@/components/ui/link-button";
import { SignOutButton } from "@/components/auth/SignOutButton";

export const metadata = createMetadata({
  title: `Super admin security — ${BRAND.name}`,
  noIndex: true,
});

export default async function SuperAdminSecurityPage() {
  await requireSuperAdmin({ skipMfa: true });

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Super admin security</h1>
            <p className="text-sm text-muted-foreground">
              Harden access to {BRAND.name} platform administration.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LinkButton href="/super-admin" variant="outline">
              Back to admin
            </LinkButton>
            <SignOutButton />
          </div>
        </div>
        <SuperAdminSecurityPanel />
        <p className="text-sm text-muted-foreground">
          Need to verify again?{" "}
          <Link href="/super-admin/mfa" className="text-primary hover:underline">
            Enter MFA code
          </Link>
        </p>
      </div>
    </div>
  );
}
