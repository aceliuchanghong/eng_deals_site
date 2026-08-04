// Dictionary entry from a shard
export type DictEntry = {
  phonetic: string | null;
  translation: string | null;
  tags: string[];
};

// Per-form count inside a lemma
export type FormCount = {
  form: string;
  count: number;
};

// A sentence example extracted from the text
export type ExampleSentence = {
  text: string;
  chapter?: string;
};

// A single result row after dict merge
export type WordResult = {
  lemma: string;
  totalCount: number;
  forms: FormCount[];
  examples: ExampleSentence[];
  phonetic: string | null;
  translation: string | null;
  tags: string[];
};

// Worker input
export type AnalyzerInput = {
  text: string;
  stopwords: Set<string>; // serialized as array for postMessage
  lemmaMap: Record<string, string>;
};

// Worker output (before dict merge)
export type AnalyzerOutput = {
  lemmas: {
    lemma: string;
    totalCount: number;
    forms: FormCount[];
    examples: ExampleSentence[];
  }[];
  totalWords: number;
  uniqueLemmasBeforeFilter: number;
};

// Saved to localStorage
export type AnalysisRecord = {
  id: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  totalWords: number;
  results: WordResult[];
  filters: {
    stopwordsLevel: StopwordsLevel;
    activeTags: string[];
  };
};

// Filter state
export type StopwordsLevel = "none" | "basic" | "strong";

export type FilterState = {
  stopwordsLevel: StopwordsLevel;
  activeTags: string[];
};

export const EXAM_TAGS = [
  "cet4", "cet6", "tem4", "tem8", "toefl", "ielts", "gre",
] as const;

export type ExamTag = (typeof EXAM_TAGS)[number];

// Processing phases
export type AnalysisPhase =
  | "idle"
  | "reading"
  | "analyzing"
  | "loading-dicts"
  | "merging"
  | "done"
  | "error";

// Dict manifest
export type DictManifest = {
  version: string;
  prefixLength: number;
  totalEntries: number;
  totalShards: number;
};
