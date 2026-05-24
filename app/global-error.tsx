"use client";

import { BRAND } from "@/lib/branding";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">{BRAND.name} encountered an error</h1>
          <p className="text-muted-foreground">
            A critical error prevented this page from loading. Please refresh or try again later.
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
