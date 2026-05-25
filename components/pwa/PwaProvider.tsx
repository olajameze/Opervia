"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getPendingMutationCount, flushMutationQueue } from "@/lib/pwa/sync-queue";
import { getSnapshot } from "@/lib/pwa/offline-db";
import { pullSnapshot } from "@/lib/pwa/sync";
import { PWA_SYNC_EVENT, type SyncSnapshot } from "@/lib/pwa/types";

type PwaContextValue = {
  isOnline: boolean;
  isInstalled: boolean;
  snapshot: SyncSnapshot | null;
  queueCount: number;
  refreshSnapshot: () => Promise<void>;
  flushQueue: () => Promise<void>;
};

const PwaContext = createContext<PwaContextValue | null>(null);

function readInstalled() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [snapshot, setSnapshot] = useState<SyncSnapshot | null>(null);
  const [queueCount, setQueueCount] = useState(0);

  const refreshLocalState = useCallback(async () => {
    setSnapshot(await getSnapshot());
    setQueueCount(await getPendingMutationCount());
  }, []);

  const refreshSnapshot = useCallback(async () => {
    const next = await pullSnapshot();
    setSnapshot(next);
    setQueueCount(await getPendingMutationCount());
  }, []);

  const flushQueue = useCallback(async () => {
    await flushMutationQueue();
    await refreshSnapshot();
  }, [refreshSnapshot]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setIsInstalled(readInstalled());

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker registration is best-effort.
      });
    }

    void refreshLocalState();

    const handleOnline = () => {
      setIsOnline(true);
      void flushQueue();
    };
    const handleOffline = () => setIsOnline(false);
    const handleSync = (event: Event) => {
      const detail = (event as CustomEvent<SyncSnapshot>).detail;
      if (detail) setSnapshot(detail);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(PWA_SYNC_EVENT, handleSync);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(PWA_SYNC_EVENT, handleSync);
    };
  }, [flushQueue, refreshLocalState]);

  const value = useMemo(
    () => ({
      isOnline,
      isInstalled,
      snapshot,
      queueCount,
      refreshSnapshot,
      flushQueue,
    }),
    [flushQueue, isInstalled, isOnline, queueCount, refreshSnapshot, snapshot]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error("usePwa must be used within PwaProvider");
  }
  return context;
}

export function useOptionalPwa() {
  return useContext(PwaContext);
}
