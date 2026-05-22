import { SuperAdminMfaForm } from "@/components/admin/SuperAdminMfaForm";
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <SuperAdminMfaForm />
    </div>
  );
}
