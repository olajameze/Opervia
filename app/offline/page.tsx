import Link from "next/link";
import { AuthBrandLockup } from "@/components/brand/AuthBrandLockup";
import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Offline",
  path: "/offline",
  noIndex: true,
});

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <AuthBrandLockup />
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-sm space-y-4">
        <h1 className="text-xl font-semibold">You&apos;re offline</h1>
        <p className="text-sm text-muted-foreground">
          Opervia could not reach the network. Open the installed app or retry once you are back online.
        </p>
        <div className="flex justify-center gap-2">
          <Button asChild>
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
