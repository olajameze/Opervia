import { Suspense } from "react";
import { getOrganizationContext } from "@/lib/auth-helpers";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingActions } from "@/components/app/BillingActions";
import { BillingStatusBanner } from "@/components/app/BillingStatusBanner";
import { BRAND } from "@/lib/branding";
import { getEffectivePlan, hasActiveSubscription, isOnActiveTrial, getTrialDaysRemaining } from "@/lib/entitlements";
import { PLANS } from "@/lib/plans";
import { formatDate } from "@/lib/utils";

export default async function BillingPage() {
  const { organization } = await getOrganizationContext();

  const plan = getEffectivePlan(organization);
  const onTrial = isOnActiveTrial(organization);
  const canEdit = hasActiveSubscription(organization);
  const trialDays = onTrial ? getTrialDaysRemaining(organization) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:grid-cols-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-muted-foreground">
            Manage your {BRAND.name} subscription and plan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/invoicing" variant="outline" size="sm">
            Go to Invoicing
          </LinkButton>
          <BillingActions organization={organization} />
        </div>
      </div>

      <Suspense fallback={null}>
        <BillingStatusBanner />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>
              {onTrial
                ? `Free trial · ${trialDays} day${trialDays === 1 ? "" : "s"} remaining`
                : `${PLANS[plan].name} — ${PLANS[plan].priceLabel}${PLANS[plan].period}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!canEdit && (
              <p className="text-muted-foreground pb-1">
                Your trial has ended. Subscribe below to restore editing across {BRAND.name}.
              </p>
            )}
            {onTrial && (
              <p className="text-muted-foreground pb-1">
                Trial includes Starter features plus Logistics and Analytics previews. Subscribe
                to Pro for Automations, or Enterprise for bulk CSV export.
              </p>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge>{organization.subscriptionStatus}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Staff</span>
              <span>Up to {PLANS[plan].maxStaff}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Freelancers</span>
              <span>Up to {PLANS[plan].maxFreelancers}</span>
            </div>
            {organization.trialEndsAt && organization.subscriptionStatus === "TRIALING" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trial ends</span>
                <span>{formatDate(organization.trialEndsAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available plans</CardTitle>
            <CardDescription>
              All plans include a {BRAND.trialDays}-day free trial (card required)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {Object.values(PLANS).map((item) => (
              <div key={item.id} className="flex justify-between border-b pb-2 last:border-0">
                <span className="font-medium">{item.name}</span>
                <span>
                  {item.priceLabel}
                  {item.period}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
