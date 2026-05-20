import { HERO } from "@/lib/branding";

import { LinkButton } from "@/components/ui/link-button";



export function EmergencyRibbon() {

  return (

    <div

      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-primary p-3 md:hidden"

      role="region"

      aria-label="Quick action"

    >

      <div className="flex items-center justify-between gap-3">

        <p className="text-xs text-primary-foreground font-medium leading-tight flex-1">

          {HERO.primaryCta}

        </p>

        <LinkButton href="/register" size="sm" variant="secondary">

          {HERO.primaryCta}

        </LinkButton>

      </div>

    </div>

  );

}

