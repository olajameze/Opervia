import Link from "next/link";

import { BRAND } from "@/lib/branding";

import { LinkButton } from "@/components/ui/link-button";



const navLinks = [

  { href: "/#features", label: "Features" },

  { href: "/#how-it-works", label: "How it works" },

  { href: "/#pricing", label: "Pricing" },

  { href: "/#faq", label: "FAQ" },

  { href: "/contact", label: "Contact" },

];



export function Header() {

  return (

    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">

      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">

        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">

          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">

            O

          </span>

          {BRAND.name}

        </Link>

        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">

          {navLinks.map((link) => (

            <Link

              key={link.href}

              href={link.href}

              className="text-sm text-muted-foreground hover:text-foreground transition-colors"

            >

              {link.label}

            </Link>

          ))}

        </nav>

        <div className="flex items-center gap-3">

          <LinkButton href="/login" variant="ghost" size="sm">

            Sign in

          </LinkButton>

          <LinkButton href="/register" size="sm">

            Start Free Trial

          </LinkButton>

        </div>

      </div>

    </header>

  );

}

