import { AuthBrandLockup } from "@/components/brand/AuthBrandLockup";
import { enforceMaintenanceMode } from "@/lib/maintenance-enforcement";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  await enforceMaintenanceMode();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <AuthBrandLockup />
      {children}
    </div>
  );
}
