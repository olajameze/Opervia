import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BRAND } from "@/lib/branding";

const faqs = [
  {
    question: "What is Opervia?",
    answer: `${BRAND.name} is a B2B SaaS platform that helps businesses manage equipment rentals, staff, freelancers, scheduling, logistics, and operations from one intelligent platform.`,
  },
  {
    question: "Who is Opervia built for?",
    answer:
      "Opervia is designed for growing teams across Europe — rental companies, field service businesses, logistics operators, and any organization tired of managing operations through spreadsheets and WhatsApp.",
  },
  {
    question: "How does the free trial work?",
    answer: `You get ${BRAND.trialDays} days of full access to all Pro plan features. No credit card required. At the end of the trial, choose a plan or your account will be paused.`,
  },
  {
    question: "Can I manage both staff and freelancers?",
    answer:
      "Yes. Opervia supports internal staff profiles with shift scheduling and freelancer profiles with job-based assignments, all within the same scheduling engine.",
  },
  {
    question: "Does Opervia integrate with Stripe for billing?",
    answer:
      "Yes. Opervia includes native Stripe integration for subscription billing, invoice generation, and payment collection.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Opervia uses organization-level data isolation, role-based access control, audit logging, and industry-standard encryption. See our Security page for details.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export { faqs };
