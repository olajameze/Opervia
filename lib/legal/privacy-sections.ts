import { BRAND } from "@/lib/branding";
import { LEGAL, type LegalSection } from "./config";

const { entityName, tradingAs, registeredAddress, privacyEmail, website } = LEGAL;

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "1. Overview",
    blocks: [
      {
        type: "p",
        text: `This Privacy Policy explains how ${entityName} (trading as ${tradingAs}) ("we", "us", or "our") collects, uses, shares, and protects personal data when you visit ${website}, create an account, or use the ${tradingAs} platform ("Service").`,
      },
      {
        type: "p",
        text: "We process personal data in accordance with the UK General Data Protection Regulation (UK GDPR), the EU General Data Protection Regulation (EU GDPR) where applicable, and other applicable data protection laws.",
      },
      {
        type: "p",
        text: `${tradingAs} is primarily a B2B service. Organisations using the Service may upload personal data about their staff, freelancers, and clients. In those cases, the customer organisation is usually the data controller and we act as a data processor — see Section 5.`,
      },
    ],
  },
  {
    id: "controller",
    title: "2. Who is responsible for your data?",
    blocks: [
      {
        type: "p",
        text: "For account registration, billing, platform security, marketing communications to account holders, and website analytics (where consented), we are the data controller.",
      },
      {
        type: "p",
        text: `Controller: ${entityName} (trading as ${tradingAs})`,
      },
      {
        type: "p",
        text: `Address: ${registeredAddress}`,
      },
      {
        type: "p",
        text: `Privacy contact: ${privacyEmail}`,
      },
    ],
  },
  {
    id: "data-collected",
    title: "3. Personal data we collect",
    blocks: [
      {
        type: "h3",
        text: "3.1 Account and identity data",
      },
      {
        type: "ul",
        items: [
          "Name, work email address, and organisation name",
          "Hashed password or authentication tokens (including optional Google sign-in identifiers if enabled)",
          "Role, permissions, and team membership within an organisation",
          "Email verification and password reset tokens",
          "Multi-factor authentication (TOTP) configuration for privileged accounts where enabled",
        ],
      },
      {
        type: "h3",
        text: "3.2 Operational data you submit",
      },
      {
        type: "ul",
        items: [
          "Staff and freelancer profiles, contact details, assignments, and schedules",
          "Client and project records, jobs, equipment, logistics, and inventory data",
          "Invoices, payments records, and billing notes you enter in the Service",
          "Workflow, automation, and notification content",
        ],
      },
      {
        type: "h3",
        text: "3.3 Billing and subscription data",
      },
      {
        type: "ul",
        items: [
          "Subscription plan, trial status, and billing history",
          "Stripe customer and subscription identifiers",
          "Payment method metadata processed by Stripe (we do not store full card numbers)",
        ],
      },
      {
        type: "h3",
        text: "3.4 Technical and usage data",
      },
      {
        type: "ul",
        items: [
          "IP address, browser type, device information, and approximate location derived from IP",
          "Log files, audit events, security signals, and error diagnostics",
          "Cookie and similar technology data as described in Section 11",
          "Analytics data (only where you have accepted analytics cookies on our marketing site)",
        ],
      },
      {
        type: "h3",
        text: "3.5 Communications",
      },
      {
        type: "ul",
        items: [
          "Messages you send via contact forms or support requests",
          "Transactional emails such as verification, password reset, team invites, and billing notices",
        ],
      },
    ],
  },
  {
    id: "lawful-bases",
    title: "4. Lawful bases for processing",
    blocks: [
      {
        type: "p",
        text: "We process personal data only where we have a lawful basis:",
      },
      {
        type: "ul",
        items: [
          "Contract — to provide the Service, manage your account, process subscriptions, and deliver support.",
          "Legitimate interests — to secure the platform, prevent fraud and abuse, improve reliability, and communicate about service-related matters, balanced against your rights.",
          "Legal obligation — to comply with applicable laws, tax rules, and lawful requests from authorities.",
          "Consent — for non-essential analytics cookies on our website and, where required, for specific optional communications. You may withdraw consent at any time.",
        ],
      },
      {
        type: "p",
        text: "Where we process personal data on behalf of a customer organisation as processor, the customer determines the lawful basis and is responsible for informing data subjects.",
      },
    ],
  },
  {
    id: "processor-role",
    title: "5. Controller and processor roles",
    blocks: [
      {
        type: "p",
        text: "When your organisation uploads personal data about employees, contractors, or third parties into the Service, your organisation is typically the data controller and we process that data as processor solely to provide the Service according to your instructions (including these Terms).",
      },
      {
        type: "p",
        text: "We implement appropriate technical and organisational measures to protect processor data. Customers must ensure they have authority to upload such data and must enter into appropriate agreements with their own data subjects.",
      },
    ],
  },
  {
    id: "how-we-use",
    title: "6. How we use personal data",
    blocks: [
      {
        type: "ul",
        items: [
          "Provide, operate, maintain, and improve the Service",
          "Authenticate users and enforce role-based access controls",
          "Process subscriptions and send billing-related communications",
          "Send transactional emails (verification, security alerts, invites, operational notifications configured by you)",
          "Monitor security, detect abuse, and maintain audit logs",
          "Respond to enquiries and support requests",
          "Comply with legal obligations and enforce our Terms",
          "Analyse aggregated or de-identified usage trends to improve the product",
        ],
      },
    ],
  },
  {
    id: "sharing",
    title: "7. Sharing and subprocessors",
    blocks: [
      {
        type: "p",
        text: "We do not sell personal data. We share data with trusted service providers who process data on our behalf under contractual safeguards, including:",
      },
      {
        type: "ul",
        items: [
          "Vercel — application hosting and infrastructure",
          "Neon (or equivalent PostgreSQL provider) — database hosting",
          "Stripe — payment processing and subscription management",
          "Resend — transactional email delivery",
          "Google — optional OAuth sign-in and, where consented, Google Analytics on our website",
          "Cloudflare — Turnstile bot protection on selected public forms (where enabled)",
        ],
      },
      {
        type: "p",
        text: "We may also disclose data where required by law, to protect rights and safety, or in connection with a merger, acquisition, or asset sale subject to appropriate confidentiality obligations.",
      },
      {
        type: "p",
        text: "Subprocessor details may change as our infrastructure evolves. We require subprocessors to protect personal data consistent with this Policy and applicable law.",
      },
    ],
  },
  {
    id: "international-transfers",
    title: "8. International transfers",
    blocks: [
      {
        type: "p",
        text: "Some subprocessors are located outside the UK or European Economic Area (EEA), including in the United States. Where personal data is transferred internationally, we rely on appropriate safeguards such as UK International Data Transfer Agreements, EU Standard Contractual Clauses, adequacy decisions, or equivalent mechanisms required by applicable law.",
      },
      {
        type: "p",
        text: "You may contact us for more information about transfer safeguards relevant to your data.",
      },
    ],
  },
  {
    id: "retention",
    title: "9. Data retention",
    blocks: [
      {
        type: "p",
        text: "We retain personal data only as long as necessary for the purposes described in this Policy:",
      },
      {
        type: "ul",
        items: [
          "Account and operational data — for the duration of your subscription and a reasonable period thereafter to allow export, dispute resolution, and backup recovery.",
          "Billing and tax records — as required by applicable financial and tax laws (typically up to six years in the UK).",
          "Security and audit logs — for a limited period appropriate to security monitoring, usually up to 12 months unless longer retention is required for an investigation.",
          "Marketing and analytics — according to consent choices and vendor retention settings.",
        ],
      },
      {
        type: "p",
        text: "When you request account deletion or your organisation terminates the Service, we will delete or anonymise personal data within 30 days except where retention is required by law or legitimate business needs (such as unresolved billing disputes or legal claims).",
      },
    ],
  },
  {
    id: "security",
    title: "10. Security",
    blocks: [
      {
        type: "p",
        text: "We implement administrative, technical, and organisational measures designed to protect personal data, including encryption in transit (HTTPS/TLS), access controls, role-based permissions, hashed credentials, and monitoring. No method of transmission or storage is completely secure; you use the Service at your own risk and should maintain strong passwords and protect account credentials.",
      },
    ],
  },
  {
    id: "cookies",
    title: "11. Cookies and similar technologies",
    blocks: [
      {
        type: "p",
        text: "We use essential cookies and similar technologies necessary for authentication, security, and core functionality of the Service. These do not require consent under applicable ePrivacy rules because they are strictly necessary.",
      },
      {
        type: "p",
        text: "On our marketing website, we may use analytics cookies (such as Google Analytics) to understand how visitors use our pages. Analytics cookies are used only after you accept them via our cookie banner. You can change your choice by clearing site data or using browser controls.",
      },
      {
        type: "ul",
        items: [
          "Essential — session authentication, security, load balancing",
          "Analytics (consent-based) — aggregated visit statistics with IP anonymisation where configured",
          "Preference — cookie consent choice stored locally in your browser",
        ],
      },
    ],
  },
  {
    id: "rights",
    title: "12. Your rights",
    blocks: [
      {
        type: "p",
        text: "Depending on your location and the capacity in which we process your data, you may have the following rights:",
      },
      {
        type: "ul",
        items: [
          "Access — request a copy of personal data we hold about you",
          "Rectification — request correction of inaccurate data",
          "Erasure — request deletion in certain circumstances",
          "Restriction — request limited processing in certain circumstances",
          "Portability — receive data you provided in a structured, commonly used format where applicable",
          "Objection — object to processing based on legitimate interests or direct marketing",
          "Withdraw consent — where processing is based on consent",
          "Automated decision-making — we do not make solely automated decisions with legal or similarly significant effects",
        ],
      },
      {
        type: "p",
        text: `To exercise rights where we are controller, contact ${privacyEmail}. We will respond within one month unless an extension is permitted by law. If we process data on behalf of your employer or organisation, please contact your organisation first.`,
      },
    ],
  },
  {
    id: "complaints",
    title: "13. Complaints and supervisory authorities",
    blocks: [
      {
        type: "p",
        text: "We encourage you to contact us first so we can address your concerns. You also have the right to lodge a complaint with a supervisory authority.",
      },
      {
        type: "ul",
        items: [
          "United Kingdom: Information Commissioner's Office (ICO) — ico.org.uk",
          "European Union: your local data protection authority in your country of residence or workplace",
        ],
      },
    ],
  },
  {
    id: "children",
    title: "14. Children",
    blocks: [
      {
        type: "p",
        text: `${tradingAs} is not directed at individuals under 18 and we do not knowingly collect personal data from children. If you believe a child has provided personal data, contact us and we will take appropriate steps to delete it.`,
      },
    ],
  },
  {
    id: "changes",
    title: "15. Changes to this Policy",
    blocks: [
      {
        type: "p",
        text: 'We may update this Privacy Policy from time to time. We will post the revised version on our website and update the "Last updated" date. Material changes will be communicated to account administrators where appropriate.',
      },
    ],
  },
  {
    id: "contact",
    title: "16. Contact us",
    blocks: [
      {
        type: "p",
        text: `For privacy questions or requests: ${privacyEmail}`,
      },
      {
        type: "p",
        text: `${entityName} (trading as ${BRAND.name}) — ${website}`,
      },
    ],
  },
];
