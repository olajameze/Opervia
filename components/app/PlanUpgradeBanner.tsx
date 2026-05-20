import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { PLANS } from "@/lib/plans";

export function PlanUpgradeBanner({ requiredPlan }: { requiredPlan: "PRO" }) {
  const plan = PLANS[requiredPlan];

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle>Upgrade to {plan.name}</CardTitle>
        <CardDescription>
          This module is included on the {plan.name} plan ({plan.priceLabel}
          {plan.period}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LinkButton href="/billing?upgrade=true">View plans</LinkButton>
      </CardContent>
    </Card>
  );
}
