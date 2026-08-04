import type { DictEntry, DictManifest, WordResult } from "@/types";
import { shardPrefix, neededShards } from "@/lib/utils";
import {
  openDictCache,
  getShard,
  putShard,
  closeDictCache,
  IndexedDBUnavailableError,
} from "@/lib/dict-cache";

// ── Internal types ───────────────────────────────────────────────

type LemmaInput = {
  lemma: string;
  totalCount: number;
  forms: { form: string; count: number }[];
  examples: { text: string; chapter?: string }[];
};

// ── Helpers ─────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

/** Promise.all with a concurrency cap — simple batching loop. */
async function batchMap<T, U>(
  items: U[],
  limit: number,
  fn: (item: U) => Promise<T>,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    results.push(...(await Promise.all(batch.map(fn))));
  }
  return results;
}

// ── Main ────────────────────────────────────────────────────────

export async function lookupDictData(
  lemmas: LemmaInput[],
): Promise<WordResult[]> {
  if (lemmas.length === 0) return [];

  // 1. Fetch manifest
  const manifest: DictManifest = await fetchJson("/dict/manifest.json");

  // 2. Open IndexedDB (may throw IndexedDBUnavailableError)
  let db: IDBDatabase | null = null;
  try {
    db = await openDictCache(manifest.version);
  } catch (err) {
    if (!(err instanceof IndexedDBUnavailableError)) {
      console.warn("IndexedDB open failed, continuing without cache:", err);
    }
  }

  try {
    // 3. Which shards do we need?
    const shards = neededShards(lemmas.map((l) => l.lemma));
    const prefixes = Array.from(shards);

    // 4. Resolve each shard: cache first, network fallback
    const shardData = new Map<string, Record<string, DictEntry>>();

    await batchMap(prefixes, 10, async (prefix) => {
      try {
        // Try IndexedDB cache
        if (db) {
          try {
            const cached = await getShard(db, prefix);
            if (cached) {
              shardData.set(prefix, cached);
              return;
            }
          } catch {
            // Cache miss / read error → fetch
          }
        }

        // Fetch from network
        const data = await fetchJson<Record<string, DictEntry>>(
          `/dict/${prefix}.json`,
        );
        shardData.set(prefix, data);

        // Persist to IndexedDB for next time
        if (db) {
          try {
            await putShard(db, prefix, data);
          } catch {
            // Non-fatal: cache write failed, data is still in memory
          }
        }
      } catch (err) {
        // H2: single shard 404/unavailable — skip it, don't fail the whole batch
        console.warn(`Dict shard ${prefix} unavailable:`, err);
      }
    });

    // 5. Merge dict data into lemma results
    const results: WordResult[] = lemmas.map((lemma) => {
      const prefix = shardPrefix(lemma.lemma);
      const shard = shardData.get(prefix);
      const entry: DictEntry | undefined = shard?.[lemma.lemma];

      return {
        lemma: lemma.lemma,
        totalCount: lemma.totalCount,
        forms: lemma.forms,
        examples: lemma.examples,
        phonetic: entry?.phonetic ?? null,
        translation: entry?.translation ?? null,
        tags: entry?.tags ?? [],
      };
    });

    // Sort by frequency descending
    results.sort((a, b) => b.totalCount - a.totalCount);

    return results;
  } finally {
    if (db) closeDictCache(db);
  }
}
