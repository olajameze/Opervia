"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { PLANS, type AppModule, getPlanDisplayName, canAccessModule, isOnActiveTrial } from "@/lib/plans";
import type { Organization } from "@prisma/client";
import {
  LayoutDashboard,
  Package,
  Users,
  Calendar,
  Truck,
  CreditCard,
  BarChart3,
  Workflow,
  Settings,
  Lock,
} from "lucide-react";

const navItems: { href: string; label: string; icon: typeof LayoutDashboard; module: AppModule }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { href: "/rentals", label: "Rentals", icon: Package, module: "rentals" },
  { href: "/workforce", label: "Workforce", icon: Users, module: "workforce" },
  { href: "/scheduling", label: "Scheduling", icon: Calendar, module: "scheduling" },
  { href: "/logistics", label: "Logistics", icon: Truck, module: "logistics" },
  { href: "/billing", label: "Billing", icon: CreditCard, module: "billing" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, module: "analytics" },
  { href: "/automations", label: "Automations", icon: Workflow, module: "automations" },
];

function NavLink({
  item,
  organization,
  pathname,
}: {
  item: (typeof navItems)[number];
  organization: Organization;
  pathname: string;
}) {
  const allowed = canAccessModule(organization, item.module);
  const isActive = pathname.startsWith(item.href);
  const isTrialPreview =
    isOnActiveTrial(organization) &&
    allowed &&
    (item.module === "logistics" || item.module === "analytics");

  const className = cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : allowed
        ? "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        : "text-muted-foreground/60 hover:bg-accent/50"
  );

  const label = (
    <>
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {isTrialPreview && (
        <span className="text-[10px] uppercase tracking-wide opacity-80">Preview</span>
      )}
      {!allowed && <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" />}
    </>
  );

  if (!allowed) {
    return (
      <Link href="/billing?upgrade=true" className={className} title="Upgrade to unlock">
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

export function AppSidebar({ organization }: { organization: Organization }) {
  const pathname = usePathname();
  const planLabel = getPlanDisplayName(organization);
  const onTrial = isOnActiveTrial(organization);

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-muted/20 min-h-screen">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          O
        </span>
        <div>
          <span className="font-semibold block">{BRAND.name}</span>
          <span className="text-xs text-muted-foreground">
            {onTrial ? "Starter + Pro preview" : `${planLabel} plan`}
          </span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1" aria-label="App navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            organization={organization}
            pathname={pathname}
          />
        ))}
      </nav>
      <div className="p-4 border-t space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname.startsWith("/settings")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

export function MobileNav({ organization }: { organization: Organization }) {
  const pathname = usePathname();
  const mobileItems = navItems.filter((item) => canAccessModule(organization, item.module)).slice(0, 5);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background flex"
      aria-label="Mobile navigation"
    >
      {mobileItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 text-xs",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
