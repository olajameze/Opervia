import type { Role } from "@prisma/client";
import type { AppModule } from "@/lib/plans";

const ALL_MODULES: AppModule[] = [
  "dashboard",
  "rentals",
  "workforce",
  "scheduling",
  "logistics",
  "billing",
  "invoicing",
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
    "invoicing",
    "analytics",
    "automations",
  ],
  DISPATCHER: ["dashboard", "rentals", "workforce", "scheduling", "logistics"],
  FINANCE: ["dashboard", "billing", "invoicing", "analytics"],
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

export type ApiPermission =
  | "workforce.write"
  | "workforce.delete"
  | "billing.write"
  | "billing.manage"
  | "organization.manage"
  | "scheduling.write"
  | "scheduling.delete"
  | "rentals.write"
  | "rentals.delete"
  | "logistics.write"
  | "logistics.delete"
  | "automations.write"
  | "automations.delete";

const ORG_MANAGERS: Role[] = ["OWNER", "ADMIN"];
const WORKFORCE_WRITERS: Role[] = ["OWNER", "ADMIN", "OPS_MANAGER"];
const SCHEDULING_WRITERS: Role[] = ["OWNER", "ADMIN", "OPS_MANAGER", "DISPATCHER"];
const BILLING_WRITERS: Role[] = ["OWNER", "ADMIN", "FINANCE"];
const OPERATIONS_WRITERS: Role[] = ["OWNER", "ADMIN", "OPS_MANAGER", "DISPATCHER"];
const AUTOMATION_WRITERS: Role[] = ["OWNER", "ADMIN", "OPS_MANAGER"];
const OPS_DELETERS: Role[] = ["OWNER", "ADMIN", "OPS_MANAGER"];

export function hasApiPermission(role: Role | undefined, permission: ApiPermission): boolean {
  if (!role) return false;

  switch (permission) {
    case "workforce.write":
      return WORKFORCE_WRITERS.includes(role);
    case "workforce.delete":
      return ORG_MANAGERS.includes(role);
    case "billing.write":
      return BILLING_WRITERS.includes(role);
    case "billing.manage":
      return ORG_MANAGERS.includes(role);
    case "organization.manage":
      return ORG_MANAGERS.includes(role);
    case "scheduling.write":
      return SCHEDULING_WRITERS.includes(role);
    case "scheduling.delete":
      return OPS_DELETERS.includes(role);
    case "rentals.write":
      return OPERATIONS_WRITERS.includes(role);
    case "rentals.delete":
      return OPS_DELETERS.includes(role);
    case "logistics.write":
      return OPERATIONS_WRITERS.includes(role);
    case "logistics.delete":
      return OPS_DELETERS.includes(role);
    case "automations.write":
      return AUTOMATION_WRITERS.includes(role);
    case "automations.delete":
      return ORG_MANAGERS.includes(role);
    default:
      return false;
  }
}

export function formatRoleLabel(role: Role): string {
  return role.replace(/_/g, " ");
}
