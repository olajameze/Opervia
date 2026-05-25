import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { OfflineMeta, QueuedMutation, SyncSnapshot } from "@/lib/pwa/types";

interface OperviaOfflineDB extends DBSchema {
  snapshot: {
    key: string;
    value: SyncSnapshot;
  };
  mutationQueue: {
    key: string;
    value: QueuedMutation;
    indexes: { "by-createdAt": string };
  };
  meta: {
    key: string;
    value: OfflineMeta;
  };
}

const DB_NAME = "opervia-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OperviaOfflineDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<OperviaOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("snapshot")) {
          db.createObjectStore("snapshot");
        }
        if (!db.objectStoreNames.contains("mutationQueue")) {
          const queue = db.createObjectStore("mutationQueue", { keyPath: "id" });
          queue.createIndex("by-createdAt", "createdAt");
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
      },
    });
  }
  return dbPromise;
}

const SNAPSHOT_KEY = "current";
const META_KEY = "current";

export async function saveSnapshot(snapshot: SyncSnapshot) {
  const db = await getDb();
  await db.put("snapshot", snapshot, SNAPSHOT_KEY);
  await db.put(
    "meta",
    {
      lastSyncedAt: snapshot.syncedAt,
      organizationId: snapshot.organizationId,
    },
    META_KEY
  );
}

export async function getSnapshot(): Promise<SyncSnapshot | null> {
  const db = await getDb();
  return (await db.get("snapshot", SNAPSHOT_KEY)) ?? null;
}

export async function getOfflineMeta(): Promise<OfflineMeta | null> {
  const db = await getDb();
  return (await db.get("meta", META_KEY)) ?? null;
}

export async function enqueueMutation(mutation: QueuedMutation) {
  const db = await getDb();
  await db.put("mutationQueue", mutation);
}

export async function listQueuedMutations(): Promise<QueuedMutation[]> {
  const db = await getDb();
  return db.getAllFromIndex("mutationQueue", "by-createdAt");
}

export async function removeQueuedMutation(id: string) {
  const db = await getDb();
  await db.delete("mutationQueue", id);
}

export async function clearMutationQueue() {
  const db = await getDb();
  await db.clear("mutationQueue");
}

export async function getQueueCount(): Promise<number> {
  const db = await getDb();
  return db.count("mutationQueue");
}
