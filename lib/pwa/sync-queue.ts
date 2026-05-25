import {
  clearMutationQueue,
  enqueueMutation,
  getQueueCount,
  listQueuedMutations,
  removeQueuedMutation,
} from "@/lib/pwa/offline-db";
import { pullSnapshot } from "@/lib/pwa/sync";
import type { QueuedMutation } from "@/lib/pwa/types";

function createMutationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `mut-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function queueMutation(
  method: string,
  url: string,
  body: string | null
): Promise<QueuedMutation> {
  const mutation: QueuedMutation = {
    id: createMutationId(),
    method,
    url,
    body,
    createdAt: new Date().toISOString(),
    idempotencyKey: createMutationId(),
  };
  await enqueueMutation(mutation);
  return mutation;
}

export async function flushMutationQueue(): Promise<{ flushed: number; failed: number }> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { flushed: 0, failed: 0 };
  }

  const mutations = await listQueuedMutations();
  let flushed = 0;
  let failed = 0;

  for (const mutation of mutations) {
    try {
      const res = await fetch(mutation.url, {
        method: mutation.method,
        headers: mutation.body ? { "Content-Type": "application/json" } : undefined,
        body: mutation.body ?? undefined,
      });

      if (res.ok) {
        await removeQueuedMutation(mutation.id);
        flushed += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
      break;
    }
  }

  if (flushed > 0) {
    await pullSnapshot();
  }

  return { flushed, failed };
}

export async function getPendingMutationCount() {
  return getQueueCount();
}

export async function clearPendingMutations() {
  await clearMutationQueue();
}
