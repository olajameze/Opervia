import type { Organization } from "@prisma/client";
import {
  canAccessModule as canAccessModuleForOrg,
  getEffectivePlan,
  getStaffLimit,
  getFreelancerLimit,
  getTeamMemberLimit,
  formatStaffLimit,
  formatFreelancerLimit,
  formatTeamMemberLimit,
  isStaffLimitReached,
  isFreelancerLimitReached,
  isTeamMemberLimitReached,
  hasActiveSubscription as orgHasActiveSubscription,
  hasBillingPortalAccess,
  hasStripeSubscription,
  getPlanDisplayName,
  isOnActiveTrial,
  getTrialDaysRemaining,
  isTrialEndingSoon,
  isTrialExpired,
  isEnterprisePlan,
  canExportData,
  canExportWorkspaceData,
  getStaffUpgradeMessage,
  getFreelancerUpgradeMessage,
  INACTIVE_SUBSCRIPTION_PATHS,
  type AppModule,
} from "./plans";

export type { AppModule };

export function hasActiveSubscription(
  org: Pick<Organization, "subscriptionStatus" | "trialEndsAt"> & {
    stripeSubscriptionId?: string | null;
  }
): boolean {
  return orgHasActiveSubscription(org);
}

export { hasBillingPortalAccess, hasStripeSubscription };

export function canAccessModule(
  org: Pick<Organization, "subscriptionStatus" | "subscriptionPlan" | "trialEndsAt">,
  module: AppModule
): boolean {
  return canAccessModuleForOrg(org, module);
}

export {
  getEffectivePlan,
  getStaffLimit,
  getFreelancerLimit,
  getTeamMemberLimit,
  formatStaffLimit,
  formatFreelancerLimit,
  formatTeamMemberLimit,
  isStaffLimitReached,
  isFreelancerLimitReached,
  isTeamMemberLimitReached,
  getPlanDisplayName,
  isOnActiveTrial,
  getTrialDaysRemaining,
  isTrialEndingSoon,
  isTrialExpired,
  isEnterprisePlan,
  canExportData,
  canExportWorkspaceData,
  getStaffUpgradeMessage,
  getFreelancerUpgradeMessage,
  INACTIVE_SUBSCRIPTION_PATHS,
};
