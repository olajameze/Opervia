import Link from "next/link";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { BRAND } from "@/lib/branding";
import { LinkButton } from "@/components/ui/link-button";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-24 md:px-6 text-center max-w-lg">
        <p className="text-sm font-semibold text-primary uppercase tracking-wide">404</p>
        <h1 className="text-3xl font-bold mt-2">Page not found</h1>
        <p className="text-muted-foreground mt-3">
          The page you requested does not exist or may have moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <LinkButton href="/">Back to home</LinkButton>
          <LinkButton href="/login" variant="outline">
            Sign in
          </LinkButton>
        </div>
        <p className="text-sm text-muted-foreground mt-8">
          Need help?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact {BRAND.name}
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
