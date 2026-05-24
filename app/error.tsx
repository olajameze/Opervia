"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { BRAND } from "@/lib/branding";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(`[${BRAND.name}] UI error`, error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          An unexpected error occurred while loading this page. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button onClick={reset}>Try again</Button>
          <LinkButton href="/dashboard" variant="outline">
            Go to dashboard
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
