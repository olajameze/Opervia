"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, Clock, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { BRAND } from "@/lib/branding";
import { PLANS } from "@/lib/plans";

const WELCOME_INTERVAL_MS = 30 * 60 * 1000;

const WELCOME_STEPS = [
  {
    title: "Build your workforce",
    description: "Add staff and freelancers under Workforce so you can assign them to jobs.",
  },
  {
    title: "Register your equipment",
    description: "Track rentals and allocations in Rentals — know what is out and who has it.",
  },
  {
    title: "Schedule and dispatch jobs",
    description: "Create jobs, assign team members, and manage shifts in Scheduling.",
  },
  {
    title: "Preview Pro features",
    description:
      "During your trial you can explore Logistics and Analytics. Automations unlock on a paid plan.",
  },
  {
    title: "Subscribe before trial ends",
    description: `Choose Starter (${PLANS.STARTER.priceLabel}/mo) or Pro (${PLANS.PRO.priceLabel}/mo) in Billing to keep full access.`,
  },
];

type AppExperienceBannersProps = {
  userId: string;
  userName: string | null;
  trialDaysRemaining: number | null;
  showTrialEnding: boolean;
  subscriptionInactive?: boolean;
};

function welcomeStorageKey(userId: string) {
  return `opervia-welcome-seen-${userId}`;
}

function trialEndingStorageKey(userId: string, trialDaysRemaining: number) {
  return `opervia-trial-ending-dismissed-${userId}-${trialDaysRemaining}`;
}

function formatTrialEndingLabel(days: number): string {
  if (days === 0) return "Your free trial ends today";
  if (days === 1) return "Your free trial ends tomorrow";
  return `Your free trial ends in ${days} days`;
}

function WelcomeGuideModal({
  userId,
  userName,
  open,
  onClose,
  onDismissPermanent,
}: {
  userId: string;
  userName: string | null;
  open: boolean;
  onClose: () => void;
  onDismissPermanent: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-background p-6 shadow-lg"
        role="dialog"
        aria-labelledby="welcome-guide-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 id="welcome-guide-title" className="font-semibold">
              Welcome to {BRAND.name}
              {userName ? `, ${userName.split(" ")[0]}` : ""}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your {BRAND.trialDays}-day trial includes Starter features plus a preview of Logistics
              and Analytics. Here is how to get started:
            </p>
          </div>
        </div>

        <ol className="space-y-2 mb-4">
          {WELCOME_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {index + 1}
              </span>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-2">
          <LinkButton href="/workforce" size="sm" onClick={onClose}>
            Start with Workforce
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </LinkButton>
          <Button variant="outline" size="sm" onClick={onClose}>
            Remind me later
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismissPermanent}>
            Don&apos;t show again
          </Button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Close welcome guide"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function AppExperienceBanners({
  userId,
  userName,
  trialDaysRemaining,
  showTrialEnding,
  subscriptionInactive = false,
}: AppExperienceBannersProps) {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showEnding, setShowEnding] = useState(false);
  const [permanentlyDismissed, setPermanentlyDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(welcomeStorageKey(userId)) === "true";
    setPermanentlyDismissed(dismissed);
    if (!dismissed && !subscriptionInactive) {
      setShowWelcomeModal(true);
    }
  }, [userId, subscriptionInactive]);

  useEffect(() => {
    if (permanentlyDismissed || subscriptionInactive) return;

    const interval = setInterval(() => {
      setShowWelcomeModal(true);
    }, WELCOME_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [permanentlyDismissed, subscriptionInactive]);

  useEffect(() => {
    if (!showTrialEnding || trialDaysRemaining === null) {
      setShowEnding(false);
      return;
    }
    const key = trialEndingStorageKey(userId, trialDaysRemaining);
    setShowEnding(localStorage.getItem(key) !== "true");
  }, [userId, showTrialEnding, trialDaysRemaining]);

  function dismissWelcomePermanent() {
    localStorage.setItem(welcomeStorageKey(userId), "true");
    setPermanentlyDismissed(true);
    setShowWelcomeModal(false);
  }

  function dismissTrialEnding() {
    if (trialDaysRemaining === null) return;
    localStorage.setItem(trialEndingStorageKey(userId, trialDaysRemaining), "true");
    setShowEnding(false);
  }

  const trialEndingLabel =
    trialDaysRemaining !== null ? formatTrialEndingLabel(trialDaysRemaining) : null;

  const showInlineBanners =
    subscriptionInactive || (!subscriptionInactive && showTrialEnding && showEnding && trialEndingLabel);

  return (
    <>
      {!subscriptionInactive && (
        <WelcomeGuideModal
          userId={userId}
          userName={userName}
          open={showWelcomeModal && !permanentlyDismissed}
          onClose={() => setShowWelcomeModal(false)}
          onDismissPermanent={dismissWelcomePermanent}
        />
      )}

      {showInlineBanners && (
        <div className="shrink-0 space-y-3 border-b bg-muted/30 px-4 py-4 md:px-6">
          {subscriptionInactive && (
            <div
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/40"
              role="alert"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <Lock className="h-5 w-5 shrink-0 text-red-700 dark:text-red-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-950 dark:text-red-100">
                      Your trial has ended
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200/90 mt-0.5">
                      Subscribe to restore full access. Your data is safe — you can review billing
                      and settings, but editing is paused until you choose a plan.
                    </p>
                  </div>
                </div>
                <LinkButton href="/billing" size="sm" className="shrink-0">
                  Choose a plan
                </LinkButton>
              </div>
            </div>
          )}

          {!subscriptionInactive && showTrialEnding && showEnding && trialEndingLabel && (
            <div
              className="relative rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 pr-10 dark:border-amber-800 dark:bg-amber-950/40"
              role="alert"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <Clock className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-950 dark:text-amber-100">
                      {trialEndingLabel}
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200/90 mt-0.5">
                      Subscribe to Starter or Pro to continue using {BRAND.name} after your trial.
                    </p>
                  </div>
                </div>
                <LinkButton href="/billing" size="sm" className="shrink-0">
                  View plans
                </LinkButton>
              </div>
              <button
                type="button"
                onClick={dismissTrialEnding}
                className="absolute right-3 top-3 rounded p-1 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50 transition-colors"
                aria-label="Dismiss trial ending reminder"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
