import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Get the 2-letter shard prefix for a word */
export function shardPrefix(word: string): string {
  const w = word.toLowerCase().slice(0, 2);
  return w.length === 2 ? w : `_${w}`;
}

/** Compute unique shard prefixes needed for a set of lemmas */
export function neededShards(lemmas: string[]): Set<string> {
  const shards = new Set<string>();
  for (const w of lemmas) {
    shards.add(shardPrefix(w));
  }
  return shards;
}

/** Tag display names */
export const TAG_LABELS: Record<string, string> = {
  cet4: "CET4",
  cet6: "CET6",
  tem4: "TEM4",
  tem8: "TEM8",
  toefl: "TOEFL",
  ielts: "IELTS",
  gre: "GRE",
};

/** Tag badge colors */
export const TAG_COLORS: Record<string, string> = {
  cet4: "bg-brand-50 text-brand-700 border-brand-200",
  cet6: "bg-indigo-50 text-indigo-700 border-indigo-200",
  tem4: "bg-violet-50 text-violet-700 border-violet-200",
  tem8: "bg-purple-50 text-purple-700 border-purple-200",
  toefl: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ielts: "bg-amber-50 text-amber-700 border-amber-200",
  gre: "bg-rose-50 text-rose-700 border-rose-200",
};

/** Apply stopwords and exam tag filters to results */
export function applyFilters(
  results: import("@/types").WordResult[],
  stopwords: Set<string>,
  activeTags: string[],
): import("@/types").WordResult[] {
  let filtered = results;

  if (stopwords.size > 0) {
    filtered = filtered.filter((r) => !stopwords.has(r.lemma.toLowerCase()));
  }

  if (activeTags.length > 0) {
    filtered = filtered.filter(
      (r) => r.tags.length === 0 || activeTags.some((t) => r.tags.includes(t)),
    );
  }

  return filtered;
}
