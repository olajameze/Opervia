import { getOrganizationContext } from "@/lib/auth-helpers";
import { AppSidebar, MobileNav } from "@/components/app/AppSidebar";
import { AppHeader } from "@/components/app/AppHeader";
import { AppExperienceBanners } from "@/components/app/AppExperienceBanners";
import { createMetadata } from "@/lib/seo";
import {
  getTrialDaysRemaining,
  isOnActiveTrial,
  isTrialEndingSoon,
} from "@/lib/entitlements";

export const metadata = createMetadata({ noIndex: true });

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, organization } = await getOrganizationContext();
  const onTrial = isOnActiveTrial(organization);

  return (
    <div className="flex min-h-screen">
      <AppSidebar organization={organization} />
      <div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
        <AppHeader />
        <AppExperienceBanners
          userId={session.user.id}
          userName={session.user.name ?? null}
          trialDaysRemaining={onTrial ? getTrialDaysRemaining(organization) : null}
          showTrialEnding={onTrial && isTrialEndingSoon(organization)}
        />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
      <MobileNav organization={organization} />
    </div>
  );
}
