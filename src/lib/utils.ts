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

/**
 * Special pseudo-tag for the WEB filter UI only: shows words that carry no exam
 * tag at all. Not a real dict tag (word.tags never contains it) — it only expands
 * the displayed/exported set. Kept out of EXAM_TAGS so the PDF/word-card never
 * render it as a badge.
 */
export const UNTAGGED = "untagged";

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

// CJK + fullwidth punctuation (+ stray ASCII brackets): a handful of ECDICT phonetic
// entries carry annotation like "英 [...] 美 [...]" or "（r）". Those chars belong to
// the CJK font, not the IPA font, and render as garbage/mojibake in the PDF phonetic,
// so drop them and any leftover bracket pairs so only the transcription remains.
const NON_PHONETIC_RE = /[　-〿＀-￯一-鿿]/g;

/** Strip slashes, stray CJK/fullwidth annotation, empty bracket pairs and trim — safe for IPA display. */
export function sanitizePhonetic(p: string | null): string {
  if (!p) return "";
  return p
    .replace(/^\/+|\/+$/g, "")
    .replace(NON_PHONETIC_RE, "")
    .replace(/[()[\]]/g, "")
    .trim();
}

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

/**
 * Apply stopwords + exam-tag filters.
 *
 * Active tags are ADDITIVE (union): a word is shown if it carries ANY selected
 * exam tag, or (when the WEB-only UNTAGGED pseudo-tag is selected) if it carries
 * no tags at all. When nothing is selected, no tag filter applies → all words.
 */
export function applyFilters(
  results: import("@/types").WordResult[],
  stopwords: Set<string>,
  activeTags: string[],
): import("@/types").WordResult[] {
  let filtered = results;

  if (stopwords.size > 0) {
    filtered = filtered.filter((r) => !stopwords.has(r.lemma.toLowerCase()));
  }

  if (activeTags.length === 0) return filtered;

  const examTags = activeTags.filter((t) => t !== UNTAGGED);
  const includeUntagged = activeTags.includes(UNTAGGED);

  filtered = filtered.filter(
    (r) =>
      (includeUntagged && r.tags.length === 0) ||
      examTags.some((t) => r.tags.includes(t)),
  );

  return filtered;
}
