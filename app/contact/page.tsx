import { Mail, MessageSquare, Phone, Clock } from "lucide-react";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { ContactForm } from "@/components/marketing/ContactForm";
import { BRAND } from "@/lib/branding";
import { getAppUrl } from "@/lib/app-url";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Contact",
  description: `Get in touch with the ${BRAND.name} team — sales, support, partnerships and product feedback.`,
  path: "/contact",
});

export default function ContactPage() {
  const appUrl = getAppUrl();
  const registerUrl = `${appUrl.replace(/^https?:\/\//, "")}/register`;

  const channels = [
    {
      icon: Mail,
      title: "Sales",
      description: "Pricing, demos and team rollouts.",
      value: BRAND.salesEmail,
      href: `mailto:${BRAND.salesEmail}`,
    },
    {
      icon: MessageSquare,
      title: "Support",
      description: "Account, billing and product questions.",
      value: BRAND.supportEmail,
      href: `mailto:${BRAND.supportEmail}`,
    },
    {
      icon: Phone,
      title: "Response time",
      description: "We reply within one business day, often sooner.",
      value: "Mon–Fri, 09:00–18:00 CET",
      href: null,
    },
    {
      icon: Clock,
      title: "Free trial",
      description: `Start a ${BRAND.trialDays}-day trial — card required at checkout.`,
      value: registerUrl,
      href: "/register",
    },
  ];

  return (
    <>
      <Header />
      <main className="pt-12 pb-20">
        <section className="container mx-auto px-4 md:px-6 max-w-3xl text-center space-y-4">
          <p className="text-xs uppercase tracking-wide text-primary font-semibold">
            Contact us
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Talk to the {BRAND.name} team
          </h1>
          <p className="text-lg text-muted-foreground">
            Tell us about your operation and we&apos;ll get back within one business day.
            Sales, support, partnerships — we&apos;re happy to help.
          </p>
        </section>

        <section className="container mx-auto px-4 md:px-6 mt-12 grid gap-10 lg:grid-cols-[1fr_360px] max-w-5xl">
          <div className="rounded-lg border bg-card p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-1">Send us a message</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Fields marked <span aria-hidden="true">*</span> are required.
            </p>
            <ContactForm />
          </div>
          <aside className="space-y-4">
            {channels.map((channel) => (
              <div key={channel.title} className="rounded-lg border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <channel.icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{channel.title}</p>
                    <p className="text-xs text-muted-foreground">{channel.description}</p>
                    {channel.href ? (
                      <a
                        href={channel.href}
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {channel.value}
                      </a>
                    ) : (
                      <p className="text-sm">{channel.value}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </aside>
        </section>
      </main>
      <Footer />
    </>
  );
}
