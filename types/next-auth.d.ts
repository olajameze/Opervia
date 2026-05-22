import "next-auth";
import type { Role, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      organizationId?: string;
      role?: Role;
      organizationName?: string;
      isSuperAdmin?: boolean;
      totpEnabled?: boolean;
      superAdminMfaVerified?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    organizationId?: string;
    role?: Role;
    organizationName?: string;
    subscriptionPlan?: SubscriptionPlan;
    subscriptionStatus?: SubscriptionStatus;
    isSuperAdmin?: boolean;
    totpEnabled?: boolean;
    superAdminMfaVerified?: boolean;
  }
}
