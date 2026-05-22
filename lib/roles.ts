import type { Role } from "@prisma/client";
import type { AppModule } from "@/lib/plans";

const ALL_MODULES: AppModule[] = [
  "dashboard",
  "rentals",
  "workforce",
  "scheduling",
  "logistics",
  "billing",
  "analytics",
  "automations",
];

/** Modules each role may see in navigation and access via page guards. */
export const ROLE_MODULE_ACCESS: Record<Role, AppModule[]> = {
  OWNER: ALL_MODULES,
  ADMIN: ALL_MODULES,
  OPS_MANAGER: [
    "dashboard",
    "rentals",
    "workforce",
    "scheduling",
    "logistics",
    "analytics",
    "automations",
  ],
  DISPATCHER: ["dashboard", "rentals", "workforce", "scheduling", "logistics"],
  FINANCE: ["dashboard", "billing", "analytics"],
  TECH: ["dashboard", "scheduling"],
  FREELANCER: ["dashboard", "scheduling"],
  VIEWER: ["dashboard", "analytics"],
};

export const INVITABLE_ROLES: Role[] = [
  "ADMIN",
  "DISPATCHER",
  "OPS_MANAGER",
  "TECH",
  "FREELANCER",
  "FINANCE",
  "VIEWER",
];

export function canRoleAccessModule(role: Role | undefined, module: AppModule): boolean {
  if (!role) return module === "dashboard";
  return ROLE_MODULE_ACCESS[role].includes(module);
}

export function canManageTeamInvites(role: Role | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function formatRoleLabel(role: Role): string {
  return role.replace(/_/g, " ");
}
