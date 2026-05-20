import { RegisterForm } from "@/components/auth/RegisterForm";
import { createMetadata } from "@/lib/seo";
import { HERO } from "@/lib/branding";

export const metadata = createMetadata({
  title: HERO.primaryCta,
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  return <RegisterForm />;
}
