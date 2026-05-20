import { getOrganizationContext } from "@/lib/auth-helpers";
import { AppSidebar, MobileNav } from "@/components/app/AppSidebar";
import { AppHeader } from "@/components/app/AppHeader";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ noIndex: true });

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { organization } = await getOrganizationContext();

  return (
    <div className="flex min-h-screen">
      <AppSidebar organization={organization} />
      <div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
        <AppHeader />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
      <MobileNav organization={organization} />
    </div>
  );
}
