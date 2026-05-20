import type { Organization } from "@prisma/client";
import {
  canAccessModule as canAccessModuleForOrg,
  getEffectivePlan,
  getTeamMemberLimit,
  formatTeamMemberLimit,
  isTeamMemberLimitReached,
  hasActiveSubscription as orgHasActiveSubscription,
  type AppModule,
} from "./plans";

export type { AppModule };

export function hasActiveSubscription(
  org: Pick<Organization, "subscriptionStatus" | "trialEndsAt">
): boolean {
  return orgHasActiveSubscription(org);
}

export function canAccessModule(
  org: Pick<Organization, "subscriptionStatus" | "subscriptionPlan" | "trialEndsAt">,
  module: AppModule
): boolean {
  return canAccessModuleForOrg(org, module);
}

export { getEffectivePlan, getTeamMemberLimit, formatTeamMemberLimit, isTeamMemberLimitReached };
