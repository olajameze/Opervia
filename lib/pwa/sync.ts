import { PWA_SYNC_EVENT, type SyncSnapshot } from "@/lib/pwa/types";
import { getSnapshot, saveSnapshot } from "@/lib/pwa/offline-db";

export async function pullSnapshot(): Promise<SyncSnapshot | null> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return getSnapshot();
  }

  try {
    const res = await fetch("/api/sync", { cache: "no-store" });
    if (!res.ok) return getSnapshot();

    const snapshot = (await res.json()) as SyncSnapshot;
    await saveSnapshot(snapshot);
    window.dispatchEvent(new CustomEvent(PWA_SYNC_EVENT, { detail: snapshot }));
    return snapshot;
  } catch {
    return getSnapshot();
  }
}

export function formatSyncTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
