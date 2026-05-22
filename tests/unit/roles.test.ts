import { describe, it, expect } from "vitest";
import {
  canRoleAccessModule,
  canManageTeamInvites,
  hasApiPermission,
  ROLE_MODULE_ACCESS,
} from "@/lib/roles";

describe("roles", () => {
  it("gives owners and admins full module access", () => {
    expect(canRoleAccessModule("OWNER", "billing")).toBe(true);
    expect(canRoleAccessModule("ADMIN", "automations")).toBe(true);
  });

  it("limits dispatchers to operations modules", () => {
    expect(canRoleAccessModule("DISPATCHER", "scheduling")).toBe(true);
    expect(canRoleAccessModule("DISPATCHER", "logistics")).toBe(true);
    expect(canRoleAccessModule("DISPATCHER", "billing")).toBe(false);
    expect(canRoleAccessModule("DISPATCHER", "analytics")).toBe(false);
  });

  it("limits field techs to dashboard and scheduling", () => {
    expect(canRoleAccessModule("TECH", "dashboard")).toBe(true);
    expect(canRoleAccessModule("TECH", "scheduling")).toBe(true);
    expect(canRoleAccessModule("TECH", "workforce")).toBe(false);
    expect(canRoleAccessModule("TECH", "rentals")).toBe(false);
  });

  it("allows finance users billing and analytics", () => {
    expect(canRoleAccessModule("FINANCE", "billing")).toBe(true);
    expect(canRoleAccessModule("FINANCE", "analytics")).toBe(true);
    expect(canRoleAccessModule("FINANCE", "scheduling")).toBe(false);
  });

  it("restricts invite management to owner and admin", () => {
    expect(canManageTeamInvites("OWNER")).toBe(true);
    expect(canManageTeamInvites("ADMIN")).toBe(true);
    expect(canManageTeamInvites("DISPATCHER")).toBe(false);
  });

  it("defines access for every role", () => {
    const roles = Object.keys(ROLE_MODULE_ACCESS);
    expect(roles).toContain("TECH");
    expect(roles).toContain("DISPATCHER");
    expect(ROLE_MODULE_ACCESS.VIEWER).toContain("analytics");
  });

  it("restricts destructive workforce actions to owner and admin", () => {
    expect(hasApiPermission("OWNER", "workforce.delete")).toBe(true);
    expect(hasApiPermission("ADMIN", "workforce.delete")).toBe(true);
    expect(hasApiPermission("OPS_MANAGER", "workforce.delete")).toBe(false);
    expect(hasApiPermission("VIEWER", "workforce.write")).toBe(false);
  });

  it("allows finance to write billing but not manage subscriptions", () => {
    expect(hasApiPermission("FINANCE", "billing.write")).toBe(true);
    expect(hasApiPermission("FINANCE", "billing.manage")).toBe(false);
  });
});
