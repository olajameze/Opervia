import { getOrganizationContext } from "@/lib/auth-helpers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { OrganizationSettingsForm } from "@/components/app/ModuleForms";

import { BRAND } from "@/lib/branding";

import { getEffectivePlan } from "@/lib/entitlements";

import { PLANS } from "@/lib/plans";

import { formatDate } from "@/lib/utils";



export default async function SettingsPage() {

  const { session, organization } = await getOrganizationContext();

  const plan = getEffectivePlan(organization);



  return (

    <div className="space-y-8 max-w-2xl">

      <div>

        <h1 className="text-2xl font-bold">Settings</h1>

        <p className="text-muted-foreground">Manage your {BRAND.name} workspace.</p>

      </div>



      <OrganizationSettingsForm name={organization.name} />



      <Card>

        <CardHeader>

          <CardTitle>Organization</CardTitle>

          <CardDescription>Workspace details</CardDescription>

        </CardHeader>

        <CardContent className="space-y-3 text-sm">

          <div className="flex justify-between">

            <span className="text-muted-foreground">Name</span>

            <span className="font-medium">{organization.name}</span>

          </div>

          <div className="flex justify-between">

            <span className="text-muted-foreground">Slug</span>

            <span className="font-medium">{organization.slug}</span>

          </div>

          <div className="flex justify-between">

            <span className="text-muted-foreground">Plan</span>

            <Badge>{PLANS[plan].name}</Badge>

          </div>

          <div className="flex justify-between">

            <span className="text-muted-foreground">Subscription</span>

            <Badge variant="secondary">{organization.subscriptionStatus}</Badge>

          </div>

          {organization.trialEndsAt && (

            <div className="flex justify-between">

              <span className="text-muted-foreground">Trial ends</span>

              <span>{formatDate(organization.trialEndsAt)}</span>

            </div>

          )}

        </CardContent>

      </Card>



      <Card>

        <CardHeader>

          <CardTitle>Your Account</CardTitle>

        </CardHeader>

        <CardContent className="space-y-3 text-sm">

          <div className="flex justify-between">

            <span className="text-muted-foreground">Name</span>

            <span className="font-medium">{session.user.name}</span>

          </div>

          <div className="flex justify-between">

            <span className="text-muted-foreground">Email</span>

            <span className="font-medium">{session.user.email}</span>

          </div>

          <div className="flex justify-between">

            <span className="text-muted-foreground">Role</span>

            <Badge variant="secondary">{session.user.role}</Badge>

          </div>

        </CardContent>

      </Card>



      <Card>

        <CardHeader>

          <CardTitle>Demo login</CardTitle>

          <CardDescription>Use these credentials after running the database seed</CardDescription>

        </CardHeader>

        <CardContent className="text-sm space-y-1">

          <p>

            <span className="text-muted-foreground">Email:</span> demo@opervia.com

          </p>

          <p>

            <span className="text-muted-foreground">Password:</span> password123

          </p>

        </CardContent>

      </Card>

    </div>

  );

}

