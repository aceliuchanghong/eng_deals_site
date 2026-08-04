import type { DictEntry } from "@/types";

// ── Version string → number ──────────────────────────────────────
// ponytail: greedy parse; collisions possible if two manifests share
// the same numeric prefix — rare enough in practice.

function versionToNumber(version: string): number {
  const digits = version.replace(/\D/g, "");
  if (digits.length > 0) return parseInt(digits, 10);
  // Fallback: treat the whole string as a timestamp
  return Date.parse(version) || 1;
}

// ── Public API ───────────────────────────────────────────────────

export class IndexedDBUnavailableError extends Error {
  constructor() {
    super("IndexedDB is not available in this environment");
    this.name = "IndexedDBUnavailableError";
  }
}

export function openDictCache(version: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      return reject(new IndexedDBUnavailableError());
    }

    const dbVersion = versionToNumber(version);
    const request = indexedDB.open("dict-cache", dbVersion);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Version bump → old store wiped
      if (db.objectStoreNames.contains("shards")) {
        db.deleteObjectStore("shards");
      }
      db.createObjectStore("shards", { keyPath: "prefix" });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(`IndexedDB open failed: ${request.error?.message}`),
      );
  });
}

export function getShard(
  db: IDBDatabase,
  prefix: string,
): Promise<Record<string, DictEntry> | null> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction("shards", "readonly");
      const store = tx.objectStore("shards");
      const req = store.get(prefix);

      req.onsuccess = () => {
        const row = req.result as { prefix: string; data: Record<string, DictEntry> } | undefined;
        resolve(row ? row.data : null);
      };
      req.onerror = () =>
        reject(new Error(`Shard read failed: ${req.error?.message}`));
    } catch (err) {
      reject(err);
    }
  });
}

export function putShard(
  db: IDBDatabase,
  prefix: string,
  data: Record<string, DictEntry>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction("shards", "readwrite");
      const store = tx.objectStore("shards");
      store.put({ prefix, data });

      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(new Error(`Shard write failed: ${tx.error?.message}`));
    } catch (err) {
      reject(err);
    }
  });
}

export function closeDictCache(db: IDBDatabase): void {
  db.close();
}
