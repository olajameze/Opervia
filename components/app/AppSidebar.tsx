"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Organization, Role } from "@prisma/client";
import { BRAND } from "@/lib/branding";
import { OperviaLogo } from "@/components/brand/OperviaLogo";
import { cn } from "@/lib/utils";
import { getPlanDisplayName, canAccessModule, isOnActiveTrial } from "@/lib/plans";
import { canRoleAccessModule } from "@/lib/roles";
import type { AppModule } from "@/lib/plans";
import {
  LayoutDashboard,
  Package,
  Users,
  Calendar,
  Truck,
  CreditCard,
  FileText,
  BarChart3,
  Workflow,
  Settings,
  Lock,
} from "lucide-react";

const navItems: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  module: AppModule;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { href: "/rentals", label: "Rentals", icon: Package, module: "rentals" },
  { href: "/workforce", label: "Workforce", icon: Users, module: "workforce" },
  { href: "/scheduling", label: "Scheduling", icon: Calendar, module: "scheduling" },
  { href: "/logistics", label: "Logistics", icon: Truck, module: "logistics" },
  { href: "/invoicing", label: "Invoicing", icon: FileText, module: "invoicing" },
  { href: "/billing", label: "Billing", icon: CreditCard, module: "billing" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, module: "analytics" },
  { href: "/automations", label: "Automations", icon: Workflow, module: "automations" },
];

function isNavVisible(role: Role | undefined, module: AppModule) {
  return canRoleAccessModule(role, module);
}

function NavLink({
  item,
  organization,
  role,
  pathname,
}: {
  item: (typeof navItems)[number];
  organization: Organization;
  role?: Role;
  pathname: string;
}) {
  if (!isNavVisible(role, item.module)) return null;

  const allowed = canAccessModule(organization, item.module);
  const isActive = pathname.startsWith(item.href);
  const isTrialPreview =
    isOnActiveTrial(organization) &&
    allowed &&
    (item.module === "logistics" || item.module === "analytics");

  const className = cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
      : allowed
        ? "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        : "text-sidebar-muted/60 hover:bg-sidebar-accent/50"
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

export function AppSidebar({
  organization,
  role,
}: {
  organization: Organization;
  role?: Role;
}) {
  const pathname = usePathname();
  const planLabel = getPlanDisplayName(organization);
  const onTrial = isOnActiveTrial(organization);

  return (
    <aside className="hidden md:flex w-64 min-h-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-6">
        <OperviaLogo size={32} variant="sidebar" />
        <div>
          <span className="font-semibold block">{BRAND.name}</span>
          <span className="text-xs text-sidebar-muted">
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
            role={role}
            pathname={pathname}
          />
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname.startsWith("/settings")
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

export function MobileNav({
  organization,
  role,
}: {
  organization: Organization;
  role?: Role;
}) {
  const pathname = usePathname();
  const mobileItems = navItems
    .filter((item) => isNavVisible(role, item.module))
    .filter((item) => canAccessModule(organization, item.module))
    .slice(0, 5);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t bg-background pb-[env(safe-area-inset-bottom,0px)]"
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
              isActive ? "text-primary font-medium" : "text-muted-foreground"
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
