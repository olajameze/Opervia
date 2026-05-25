"use client";

import type { SubscriptionPlan } from "@prisma/client";
import { PLANS } from "@/lib/plans";
import { BRAND } from "@/lib/branding";
import { cn } from "@/lib/utils";

const planOptions: SubscriptionPlan[] = ["STARTER", "PRO", "ENTERPRISE"];

export function PlanPicker({
  value,
  onChange,
  name = "plan",
}: {
  value: SubscriptionPlan;
  onChange: (plan: SubscriptionPlan) => void;
  name?: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium leading-none">Choose your plan</legend>
      <p className="text-xs text-muted-foreground pb-1">
        {BRAND.trialDays}-day free trial · Card required · No charge until trial ends
      </p>
      <div className="space-y-2">
        {planOptions.map((planId) => {
          const plan = PLANS[planId];
          const selected = value === planId;

          return (
            <label
              key={planId}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                selected ? "border-primary bg-primary/5" : "hover:border-primary/40"
              )}
            >
              <input
                type="radio"
                name={name}
                value={planId}
                checked={selected}
                onChange={() => onChange(planId)}
                className="mt-1"
              />
              <span className="flex-1 space-y-0.5">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium">{plan.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {plan.priceLabel}
                    {plan.period}
                  </span>
                </span>
                <span className="block text-xs text-muted-foreground">{plan.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
