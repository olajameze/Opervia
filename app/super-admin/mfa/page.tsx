import { SuperAdminMfaForm } from "@/components/admin/SuperAdminMfaForm";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireSuperAdmin } from "@/lib/super-admin";
import { createMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/branding";

export const metadata = createMetadata({
  title: `Super admin MFA — ${BRAND.name}`,
  noIndex: true,
});

export default async function SuperAdminMfaPage() {
  await requireSuperAdmin({ skipMfa: true });

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 gap-4">
      <div className="absolute top-4 right-4">
        <SignOutButton />
      </div>
      <SuperAdminMfaForm />
    </div>
  );
}
