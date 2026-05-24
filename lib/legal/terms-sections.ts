import { BRAND } from "@/lib/branding";
import { LEGAL, type LegalSection } from "./config";

const { entityName, tradingAs, registeredAddress, jurisdiction, trialDays, plans } =
  LEGAL;

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "introduction",
    title: "1. Introduction and acceptance",
    blocks: [
      {
        type: "p",
        text: `These Terms of Service ("Terms") govern access to and use of the ${tradingAs} platform ("${tradingAs}", "Service", "we", "us", or "our") operated by ${entityName} (trading as ${tradingAs}), with a registered address at ${registeredAddress}.`,
      },
      {
        type: "p",
        text: `By creating an account, accessing, or using ${tradingAs}, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, you must not use the Service.`,
      },
      {
        type: "p",
        text: `${tradingAs} is a business-to-business (B2B) software-as-a-service platform. These Terms are intended for use by organisations and individuals acting in a business or professional capacity, not for personal consumer use unrelated to trade, business, craft, or profession.`,
      },
    ],
  },
  {
    id: "service",
    title: "2. Description of the Service",
    blocks: [
      {
        type: "p",
        text: `${tradingAs} provides cloud-based tools to help businesses manage equipment rentals, workforce and freelancer records, scheduling, logistics, invoicing, operational workflows, analytics, notifications, and related administrative functions.`,
      },
      {
        type: "p",
        text: "We may update, improve, or modify features from time to time. We do not guarantee that any specific feature will remain available indefinitely. Where material changes adversely affect paid functionality, we will use reasonable efforts to notify account administrators in advance.",
      },
      {
        type: "p",
        text: `${tradingAs} is an operational software tool only. We do not provide legal, tax, accounting, employment, financial, or regulatory advice. You remain solely responsible for how you use the Service and for compliance with laws applicable to your business, including employment law, health and safety obligations, data protection law, and tax reporting.`,
      },
    ],
  },
  {
    id: "eligibility",
    title: "3. Eligibility and account registration",
    blocks: [
      {
        type: "ul",
        items: [
          "You must be at least 18 years old and have authority to bind the organisation on whose behalf you register.",
          "You must provide accurate, current, and complete registration information and keep it up to date.",
          "You are responsible for maintaining the confidentiality of account credentials and for all activity under your account.",
          "You must notify us promptly at the contact details in Section 18 if you suspect unauthorised access.",
          "One person may not maintain more than one free trial organisation for the same business purpose unless we expressly approve otherwise.",
        ],
      },
    ],
  },
  {
    id: "subscriptions",
    title: "4. Free trial, subscriptions, and billing",
    blocks: [
      {
        type: "h3",
        text: "4.1 Free trial",
      },
      {
        type: "p",
        text: `New organisations may receive a ${trialDays}-day free trial with access to selected features. No payment card is required to start a trial unless you choose to subscribe before the trial ends. When the trial expires, continued access to paid features requires an active paid subscription.`,
      },
      {
        type: "h3",
        text: "4.2 Paid plans",
      },
      {
        type: "p",
        text: `Paid subscription plans are billed in British pounds (GBP) on a recurring monthly basis unless otherwise stated at checkout. Current published plans include Starter (${plans.starter}), Pro (${plans.pro}), and Enterprise (${plans.enterprise}). Plan limits, features, and pricing may change; we will apply price changes to renewals after reasonable notice where required by law.`,
      },
      {
        type: "h3",
        text: "4.3 Payment processing",
      },
      {
        type: "p",
        text: 'Payments are processed by Stripe Payments Europe, Limited (or its affiliates) ("Stripe"). We do not store full payment card numbers on our servers. By subscribing, you authorise Stripe to charge your selected payment method for recurring fees, applicable taxes, and any agreed add-ons.',
      },
      {
        type: "h3",
        text: "4.4 Taxes",
      },
      {
        type: "p",
        text: "Fees are exclusive of VAT and other applicable taxes unless stated otherwise. Where required by law, VAT or similar taxes will be added at checkout or on invoices. You are responsible for any taxes arising from your use of the Service except taxes based on our net income.",
      },
      {
        type: "h3",
        text: "4.5 Renewal and cancellation",
      },
      {
        type: "p",
        text: "Subscriptions renew automatically at the end of each billing period unless cancelled before renewal. You may cancel at any time through the billing area of the Service (Stripe Customer Portal) or by contacting us. Cancellation stops future charges but does not entitle you to a refund for the current billing period except where required by applicable law or expressly stated by us in writing.",
      },
      {
        type: "h3",
        text: "4.6 Failed payments and suspension",
      },
      {
        type: "p",
        text: "If payment fails, we may suspend or limit access until payment is received. We may terminate accounts with persistent non-payment after reasonable notice.",
      },
      {
        type: "h3",
        text: "4.7 Refunds",
      },
      {
        type: "p",
        text: "Except where mandatory consumer or statutory rights apply (which are limited for B2B contracts), fees are non-refundable once a billing period has started. If you believe you were charged in error, contact us within 14 days of the charge.",
      },
    ],
  },
  {
    id: "financial-disclaimer",
    title: "5. Financial and invoicing disclaimer",
    blocks: [
      {
        type: "p",
        text: `${tradingAs} is not a bank, payment institution, e-money issuer, or regulated financial services provider. We do not hold customer funds, provide credit, or execute payment transfers between you and your clients except by facilitating subscription billing through Stripe.`,
      },
      {
        type: "p",
        text: "Invoicing, payment tracking, and billing features are provided as administrative tools. You are solely responsible for the accuracy of invoices you issue, collection of amounts owed to you, compliance with applicable invoicing and tax rules (including VAT), anti-money-laundering obligations where relevant, and any contractual terms between you and your customers or workers.",
      },
    ],
  },
  {
    id: "customer-data",
    title: "6. Customer data and data protection roles",
    blocks: [
      {
        type: "p",
        text: `"Customer Data" means operational data you or your users submit to the Service, including information about staff, freelancers, clients, jobs, equipment, schedules, invoices, and related records.`,
      },
      {
        type: "p",
        text: "For Customer Data containing personal data, you are typically the data controller and we act as your data processor, processing such data only on your documented instructions as set out in these Terms and our Privacy Policy. You must have a lawful basis to collect and upload personal data and must provide any required notices to data subjects.",
      },
      {
        type: "p",
        text: "For account, billing, security, and platform administration data relating to your organisation and users, we act as an independent data controller as described in our Privacy Policy.",
      },
      {
        type: "p",
        text: "You must not upload special category data (such as health data or trade union membership) or criminal offence data unless strictly necessary, lawful, and adequately protected. You indemnify us against claims arising from your unlawful processing of personal data uploaded to the Service.",
      },
    ],
  },
  {
    id: "acceptable-use",
    title: "7. Acceptable use",
    blocks: [
      {
        type: "p",
        text: "You agree not to:",
      },
      {
        type: "ul",
        items: [
          "Use the Service for any unlawful, fraudulent, or harmful purpose.",
          "Attempt to gain unauthorised access to the Service, other accounts, or our infrastructure.",
          "Reverse engineer, decompile, or attempt to extract source code except where permitted by mandatory law.",
          "Introduce malware, perform denial-of-service attacks, or scrape the Service in a manner that impairs performance.",
          "Use the Service to send unsolicited marketing in violation of applicable electronic communications laws.",
          "Misrepresent your identity or affiliation, or upload content that infringes third-party intellectual property or privacy rights.",
          "Resell, sublicense, or provide the Service to third parties except as expressly permitted by your plan and these Terms.",
          "Use the Service in a manner that violates export control, sanctions, or anti-bribery laws.",
        ],
      },
      {
        type: "p",
        text: "We may investigate suspected violations and suspend or terminate access where reasonably necessary to protect the Service, users, or third parties.",
      },
    ],
  },
  {
    id: "intellectual-property",
    title: "8. Intellectual property",
    blocks: [
      {
        type: "p",
        text: `We and our licensors retain all rights, title, and interest in ${tradingAs}, including software, branding, documentation, and underlying technology. No rights are granted except as expressly stated in these Terms.`,
      },
      {
        type: "p",
        text: "You retain ownership of Customer Data. You grant us a non-exclusive, worldwide licence to host, copy, transmit, and display Customer Data solely to provide, secure, and improve the Service and as otherwise described in our Privacy Policy.",
      },
      {
        type: "p",
        text: "If you provide feedback or suggestions, you grant us a perpetual, royalty-free licence to use them without obligation to you.",
      },
    ],
  },
  {
    id: "confidentiality",
    title: "9. Confidentiality",
    blocks: [
      {
        type: "p",
        text: "Each party may receive confidential information from the other. The receiving party will protect such information using reasonable care and use it only for purposes related to the Service. This obligation does not apply to information that is public, independently developed, or lawfully obtained from a third party without restriction.",
      },
    ],
  },
  {
    id: "availability",
    title: "10. Service availability and support",
    blocks: [
      {
        type: "p",
        text: "We aim to provide reliable access but do not guarantee uninterrupted or error-free operation. Scheduled maintenance, third-party outages, and events outside our reasonable control may affect availability. Support is provided on a commercially reasonable basis according to your plan; unless otherwise agreed in writing, no specific service-level agreement applies.",
      },
    ],
  },
  {
    id: "warranties",
    title: "11. Warranties disclaimer",
    blocks: [
      {
        type: "p",
        text: `To the fullest extent permitted by law, the Service is provided "as is" and "as available". We disclaim all warranties, whether express, implied, or statutory, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will meet your requirements or that results obtained from the Service will be accurate or reliable.`,
      },
    ],
  },
  {
    id: "liability",
    title: "12. Limitation of liability",
    blocks: [
      {
        type: "p",
        text: "Nothing in these Terms limits or excludes liability that cannot be limited or excluded under applicable law, including liability for death or personal injury caused by negligence, fraud, or fraudulent misrepresentation.",
      },
      {
        type: "p",
        text: "Subject to the above, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits, revenue, goodwill, data, or business opportunity, even if advised of the possibility of such damages.",
      },
      {
        type: "p",
        text: `Subject to the above, our total aggregate liability arising out of or relating to the Service or these Terms shall not exceed the greater of (a) the fees paid by you to us in the twelve (12) months preceding the event giving rise to the claim, or (b) one hundred pounds (£100).`,
      },
    ],
  },
  {
    id: "indemnity",
    title: "13. Indemnity",
    blocks: [
      {
        type: "p",
        text: "You will defend, indemnify, and hold harmless us, our affiliates, directors, officers, employees, and agents from and against claims, damages, losses, and expenses (including reasonable legal fees) arising out of or related to: (a) your use of the Service; (b) Customer Data or content you submit; (c) your breach of these Terms or applicable law; or (d) disputes between you and your employees, contractors, clients, or other third parties.",
      },
    ],
  },
  {
    id: "termination",
    title: "14. Suspension and termination",
    blocks: [
      {
        type: "p",
        text: "You may stop using the Service and cancel your subscription at any time. We may suspend or terminate access if you materially breach these Terms, fail to pay fees, pose a security risk, or where required by law. Upon termination, your right to access the Service ceases.",
      },
      {
        type: "p",
        text: "We will make Customer Data available for export where your plan includes export functionality and for a reasonable period after termination, subject to our Privacy Policy retention rules. Sections that by nature should survive termination (including payment obligations, intellectual property, confidentiality, disclaimers, limitation of liability, indemnity, and governing law) will survive.",
      },
    ],
  },
  {
    id: "changes",
    title: "15. Changes to these Terms",
    blocks: [
      {
        type: "p",
        text: 'We may update these Terms from time to time. We will post the updated version on our website and update the "Last updated" date. Material changes will be notified to account administrators by email or in-app notice where practicable. Continued use after the effective date constitutes acceptance. If you do not agree to updated Terms, you must stop using the Service and cancel your subscription.',
      },
    ],
  },
  {
    id: "governing-law",
    title: "16. Governing law and jurisdiction",
    blocks: [
      {
        type: "p",
        text: `These Terms are governed by the laws of ${jurisdiction}. The courts of ${jurisdiction} shall have exclusive jurisdiction to settle disputes arising out of or in connection with these Terms, subject to any mandatory rights you may have under applicable law.`,
      },
    ],
  },
  {
    id: "miscellaneous",
    title: "17. Miscellaneous",
    blocks: [
      {
        type: "ul",
        items: [
          "These Terms, together with the Privacy Policy and any order or checkout terms presented at purchase, constitute the entire agreement regarding the Service.",
          "If any provision is held invalid, the remaining provisions remain in effect.",
          "Our failure to enforce a provision is not a waiver of that provision.",
          "You may not assign these Terms without our consent; we may assign them in connection with a merger, acquisition, or sale of assets.",
          "Nothing in these Terms creates a partnership, agency, or employment relationship between the parties.",
        ],
      },
    ],
  },
  {
    id: "contact",
    title: "18. Contact",
    blocks: [
      {
        type: "p",
        text: `For questions about these Terms, contact ${entityName} (trading as ${tradingAs}) at ${LEGAL.legalEmail}.`,
      },
      {
        type: "p",
        text: `${BRAND.name} — ${LEGAL.website}`,
      },
    ],
  },
];
