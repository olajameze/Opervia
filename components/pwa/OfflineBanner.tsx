"use client";

import { usePwa } from "@/components/pwa/PwaProvider";
import { formatSyncTime } from "@/lib/pwa/sync";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const { isOnline, queueCount } = usePwa();

  if (isOnline) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950">
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>
          Offline mode — showing cached data.
          {queueCount > 0 ? ` ${queueCount} change${queueCount === 1 ? "" : "s"} waiting to sync.` : ""}
        </span>
      </div>
    </div>
  );
}

export function OnlineSyncBanner() {
  const { isOnline, queueCount, flushQueue } = usePwa();

  if (!isOnline || queueCount === 0) return null;

  return (
    <div className="border-b border-primary/20 bg-primary/5 px-4 py-2 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>{queueCount} offline change{queueCount === 1 ? "" : "s"} ready to sync.</span>
        <button type="button" className="text-primary hover:underline" onClick={() => void flushQueue()}>
          Sync now
        </button>
      </div>
    </div>
  );
}

export function OfflineMetaLine() {
  const { snapshot } = usePwa();
  return (
    <p className="text-xs text-muted-foreground">
      Last synced: {formatSyncTime(snapshot?.syncedAt)}
    </p>
  );
}
