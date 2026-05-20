"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { PLANS, type AppModule } from "@/lib/plans";
import type { Organization } from "@prisma/client";
import { getEffectivePlan, canAccessModule } from "@/lib/entitlements";
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

function filterNavItems(organization: Organization) {
  return navItems.filter((item) => canAccessModule(organization, item.module));
}

export function AppSidebar({ organization }: { organization: Organization }) {
  const pathname = usePathname();
  const items = filterNavItems(organization);
  const plan = getEffectivePlan(organization);

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-muted/20 min-h-screen">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          O
        </span>
        <div>
          <span className="font-semibold block">{BRAND.name}</span>
          <span className="text-xs text-muted-foreground">{PLANS[plan].name} plan</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1" aria-label="App navigation">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
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
  const mobileItems = filterNavItems(organization).slice(0, 5);

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
