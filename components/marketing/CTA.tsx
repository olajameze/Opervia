import { HERO, BRAND } from "@/lib/branding";

import { LinkButton } from "@/components/ui/link-button";



export function CTA() {

  return (

    <section className="py-20 md:py-28">

      <div className="container mx-auto px-4 md:px-6">

        <div className="rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">

            {BRAND.tagline}

          </h2>

          <p className="mx-auto max-w-xl text-primary-foreground/80 mb-8 text-lg">

            Join growing teams across Europe who have replaced operational chaos with {BRAND.name}.

          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

            <LinkButton href="/register" size="lg" variant="secondary">

              {HERO.primaryCta}

            </LinkButton>

            <LinkButton

              href="#features"

              size="lg"

              variant="outline"

              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"

            >

              {HERO.secondaryCta}

            </LinkButton>

          </div>

        </div>

      </div>

    </section>

  );

}

