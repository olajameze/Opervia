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
    <div data-app-shell className="flex h-dvh max-h-dvh overflow-hidden">
      <AppSidebar organization={organization} role={session.user.role} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppHeader />
        <AppExperienceBanners
          userId={session.user.id}
          userName={session.user.name ?? null}
          trialDaysRemaining={onTrial ? getTrialDaysRemaining(organization) : null}
          showTrialEnding={onTrial && isTrialEndingSoon(organization)}
          subscriptionInactive={subscriptionInactive}
        />
        <main className="app-main-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-6 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-6">
          <AppOfflineGate>{children}</AppOfflineGate>
        </main>
      </div>
      <MobileNav organization={organization} role={session.user.role} />
    </div>
  );
}
