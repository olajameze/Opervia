import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { createMetadata } from "@/lib/seo";
import { isMaintenanceModeEnabled } from "@/lib/maintenance";

export const metadata = createMetadata({
  title: "Sign In",
  path: "/login",
  noIndex: true,
});

export default async function LoginPage() {
  const session = await auth();
  const maintenanceOn = await isMaintenanceModeEnabled();
  const showGoogleAuth = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  );

  if (session?.user?.id && !maintenanceOn) {
    if (session.user.isSuperAdmin) redirect("/super-admin");
    if (session.user.organizationId) redirect("/dashboard");
    redirect("/onboarding");
  }

  if (session?.user?.id && maintenanceOn && session.user.isSuperAdmin) {
    redirect("/super-admin");
  }

  return (
    <Suspense>
      <LoginForm
        showGoogleAuth={showGoogleAuth}
        signedInEmail={maintenanceOn ? session?.user?.email ?? undefined : undefined}
        defaultCallbackUrl={maintenanceOn ? "/super-admin" : "/dashboard"}
      />
    </Suspense>
  );
}
