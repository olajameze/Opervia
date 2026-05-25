import { getOrganizationContext, enforceSubscriptionAccess } from "@/lib/auth-helpers";
import { enforceMaintenanceMode } from "@/lib/maintenance-enforcement";
import { AppSidebar, MobileNav } from "@/components/app/AppSidebar";
import { AppHeader } from "@/components/app/AppHeader";
import { AppExperienceBanners } from "@/components/app/AppExperienceBanners";
import { AppOfflineGate } from "@/components/pwa/AppOfflineGate";
import { createMetadata } from "@/lib/seo";
import {
  getTrialDaysRemaining,
  hasActiveSubscription,
  isOnActiveTrial,
  isTrialEndingSoon,
} from "@/lib/entitlements";

export const metadata = createMetadata({ noIndex: true });

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await enforceMaintenanceMode();
  const { session, organization } = await getOrganizationContext();
  enforceSubscriptionAccess(organization);

  const onTrial = isOnActiveTrial(organization);
  const subscriptionInactive = !hasActiveSubscription(organization);

  return (
    <div className="flex min-h-screen">
      <AppSidebar organization={organization} role={session.user.role} />
      <div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
        <AppHeader />
        <AppExperienceBanners
          userId={session.user.id}
          userName={session.user.name ?? null}
          trialDaysRemaining={onTrial ? getTrialDaysRemaining(organization) : null}
          showTrialEnding={onTrial && isTrialEndingSoon(organization)}
          subscriptionInactive={subscriptionInactive}
        />
        <main className="flex-1 p-6 overflow-auto">
          <AppOfflineGate>{children}</AppOfflineGate>
        </main>
      </div>
      <MobileNav organization={organization} role={session.user.role} />
    </div>
  );
}
