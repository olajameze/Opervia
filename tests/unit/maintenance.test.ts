import { describe, expect, it } from "vitest";
import { isMaintenanceExemptPath } from "@/lib/maintenance-paths";

describe("maintenance path exemptions", () => {
  it("allows super-admin and maintenance console during maintenance", () => {
    expect(isMaintenanceExemptPath("/super-admin")).toBe(true);
    expect(isMaintenanceExemptPath("/maintenance")).toBe(true);
    expect(isMaintenanceExemptPath("/login")).toBe(true);
    expect(isMaintenanceExemptPath("/under-maintenance")).toBe(true);
  });

  it("blocks registration, app pages, and public auth helpers", () => {
    expect(isMaintenanceExemptPath("/register")).toBe(false);
    expect(isMaintenanceExemptPath("/dashboard")).toBe(false);
    expect(isMaintenanceExemptPath("/onboarding")).toBe(false);
    expect(isMaintenanceExemptPath("/forgot-password")).toBe(false);
    expect(isMaintenanceExemptPath("/verify-email")).toBe(false);
  });

  it("allows auth and admin APIs but blocks registration API", () => {
    expect(isMaintenanceExemptPath("/api/auth/signin")).toBe(true);
    expect(isMaintenanceExemptPath("/api/admin/system")).toBe(true);
    expect(isMaintenanceExemptPath("/api/system/maintenance")).toBe(true);
    expect(isMaintenanceExemptPath("/api/register")).toBe(false);
    expect(isMaintenanceExemptPath("/api/contact")).toBe(false);
  });
});
