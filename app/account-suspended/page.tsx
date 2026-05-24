import { BRAND } from "@/lib/branding";
import { LinkButton } from "@/components/ui/link-button";

export default function AccountSuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Account suspended</h1>
        <p className="text-muted-foreground">
          Your {BRAND.name} workspace has been temporarily suspended. Please contact{" "}
          <a href={`mailto:${BRAND.supportEmail}`} className="text-primary hover:underline">
            {BRAND.supportEmail}
          </a>{" "}
          if you believe this is an error.
        </p>
        <LinkButton href="/login" variant="outline">
          Back to sign in
        </LinkButton>
      </div>
    </div>
  );
}
