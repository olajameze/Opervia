"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Organization, Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { canAccessModule, isOnActiveTrial } from "@/lib/plans";
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
  MoreHorizontal,
  Lock,
  type LucideIcon,
} from "lucide-react";

const navItems: {
  href: string;
  label: string;
  icon: LucideIcon;
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

const PRIMARY_MOBILE_MODULES: AppModule[] = [
  "dashboard",
  "rentals",
  "workforce",
  "scheduling",
];

const MORE_MENU_MODULES: AppModule[] = [
  "logistics",
  "invoicing",
  "billing",
  "analytics",
  "automations",
];

function isNavVisible(role: Role | undefined, module: AppModule) {
  return canRoleAccessModule(role, module);
}

function filterNavItem(
  item: (typeof navItems)[number],
  organization: Organization,
  role?: Role
) {
  if (!isNavVisible(role, item.module)) return false;
  return true;
}

function MobileMoreMenuItem({
  item,
  organization,
  pathname,
  onNavigate,
}: {
  item: (typeof navItems)[number] | { href: string; label: string; icon: LucideIcon; module: AppModule };
  organization: Organization;
  pathname: string;
  onNavigate: () => void;
}) {
  const allowed =
    item.href === "/settings" || canAccessModule(organization, item.module);
  const isActive = pathname.startsWith(item.href);
  const isTrialPreview =
    item.href !== "/settings" &&
    isOnActiveTrial(organization) &&
    allowed &&
    (item.module === "logistics" || item.module === "analytics");

  const className = cn(
    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm",
    isActive ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
  );

  const Icon = item.icon;

  return (
    <li>
      <Link
        href={allowed ? item.href : "/billing?upgrade=true"}
        className={className}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">{item.label}</span>
        {isTrialPreview ? (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Preview</span>
        ) : null}
        {!allowed ? <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" /> : null}
      </Link>
    </li>
  );
}

function MobileMoreButton({
  active,
  open,
  onToggle,
}: {
  active: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const className = cn(
    "flex-1 flex flex-col items-center gap-1 py-2 text-xs",
    active || open ? "text-primary font-medium" : "text-muted-foreground"
  );

  if (open) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={className}
        aria-expanded="true"
        aria-controls="mobile-more-menu"
        aria-haspopup="dialog"
        aria-label="More pages"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        More
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={className}
      aria-expanded="false"
      aria-controls="mobile-more-menu"
      aria-haspopup="menu"
      aria-label="More pages"
    >
      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      More
    </button>
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
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems = navItems.filter(
    (item) =>
      PRIMARY_MOBILE_MODULES.includes(item.module) && filterNavItem(item, organization, role)
  );

  const moreItems = [
    ...navItems.filter(
      (item) =>
        MORE_MENU_MODULES.includes(item.module) && filterNavItem(item, organization, role)
    ),
    { href: "/settings", label: "Settings", icon: Settings, module: "dashboard" as AppModule },
  ];

  const morePaths = [...moreItems.map((i) => i.href), "/settings"];
  const isMoreActive = morePaths.some((path) => pathname.startsWith(path));

  return (
    <>
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {moreOpen && (
        <div
          id="mobile-more-menu"
          className="md:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-50 mx-3 rounded-lg border bg-background p-2 shadow-lg"
          role="dialog"
          aria-modal="true"
          aria-label="More navigation"
        >
          <ul className="space-y-1">
            {moreItems.map((item) => (
              <MobileMoreMenuItem
                key={item.href}
                item={item}
                organization={organization}
                pathname={pathname}
                onNavigate={() => setMoreOpen(false)}
              />
            ))}
          </ul>
        </div>
      )}

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t bg-background pb-[env(safe-area-inset-bottom,0px)]"
        aria-label="Mobile navigation"
      >
        {primaryItems.map((item) => {
          const allowed = canAccessModule(organization, item.module);
          const isActive = pathname.startsWith(item.href);
          const href = allowed ? item.href : "/billing?upgrade=true";

          return (
            <Link
              key={item.href}
              href={href}
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

        {moreItems.length > 0 ? (
          <MobileMoreButton
            open={moreOpen}
            active={isMoreActive}
            onToggle={() => setMoreOpen((open) => !open)}
          />
        ) : null}
      </nav>
    </>
  );
}
