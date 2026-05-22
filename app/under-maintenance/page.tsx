import { getSystemSettings } from "@/lib/system-settings";
import { BRAND } from "@/lib/branding";
import { LinkButton } from "@/components/ui/link-button";
import { Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

const FALLBACK_MESSAGE =
  "We are performing scheduled maintenance and will be back running shortly. Thank you for your patience.";

export default async function UnderMaintenancePage() {
  let message: string = FALLBACK_MESSAGE;
  try {
    const settings = await getSystemSettings();
    message = settings.maintenanceMessage ?? FALLBACK_MESSAGE;
  } catch {
    // Database unreachable — render the static fallback rather than crashing.
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Wrench className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{BRAND.name} is under maintenance</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>
        <LinkButton href="/login" variant="outline">
          Admin sign in
        </LinkButton>
      </div>
    </div>
  );
}
