import { auth, signOut } from "@/auth";
import { getOrganizationContext } from "@/lib/auth-helpers";
import { BRAND } from "@/lib/branding";
import { getEffectivePlan, getPlanDisplayName, isOnActiveTrial } from "@/lib/entitlements";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationsBell } from "@/components/app/NotificationsBell";

export async function AppHeader() {
  const session = await auth();
  const { organization } = await getOrganizationContext();
  const plan = getEffectivePlan(organization);
  const planLabel = getPlanDisplayName(organization);
  const onTrial = isOnActiveTrial(organization);

  return (
    <header className="flex h-16 items-center justify-between border-b px-6 bg-background">
      <div>
        <p className="text-sm text-muted-foreground">{BRAND.name}</p>
        <p className="font-semibold">{session?.user?.organizationName ?? "Workspace"}</p>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {onTrial ? planLabel : PLANS[plan].name}
        </Badge>
        {session?.user?.role && (
          <Badge variant="outline" className="hidden sm:inline-flex">
            {session.user.role}
          </Badge>
        )}
        <NotificationsBell />
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">{session?.user?.name}</p>
          <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button variant="outline" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
