// ── Message protocol ──────────────────────────────────────────────

interface WorkerMessage {
  type: "analyze";
  text: string;
  stopwords: string[];
  lemmaMap: Record<string, string>;
}

interface ProgressMsg {
  type: "progress";
  phase: string;
  percent: number;
}

interface ResultMsg {
  type: "result";
  lemmas: LemmaBlock[];
  totalWords: number;
  uniqueLemmasBeforeFilter: number;
}

interface ErrorMsg {
  type: "error";
  message: string;
}

type WorkerResponse = ProgressMsg | ResultMsg | ErrorMsg;

interface LemmaBlock {
  lemma: string;
  totalCount: number;
  forms: { form: string; count: number }[];
  examples: { text: string; chapter?: string }[];
}

// ── Regex constants ──────────────────────────────────────────────

const WORD_RE = /[a-zA-Z]+(?:'[a-zA-Z]+)?/g;
const CHAPTER_RE = /chapter\s+(?:\d+|[a-z]+)/gi;
// Sentence boundary: .!? then optional closing punctuation, then whitespace, then capital letter
const BOUNDARY_RE = /[.!?]["')”’\]]*\s+(?=[A-Z])/g;

// ── Helpers ─────────────────────────────────────────────────────

function post(phase: string, percent: number): void {
  self.postMessage({ type: "progress", phase, percent } satisfies ProgressMsg);
}

function findChapters(text: string): { index: number; label: string }[] {
  const markers: { index: number; label: string }[] = [];
  const re = new RegExp(CHAPTER_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    markers.push({ index: m.index, label: m[0] });
  }
  return markers;
}

function chapterFor(
  wordIndex: number,
  chapters: { index: number; label: string }[],
): string | undefined {
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (chapters[i].index <= wordIndex) return chapters[i].label;
  }
  return undefined;
}

function splitSentences(
  text: string,
): { text: string; start: number; end: number }[] {
  const boundaries: number[] = [0];
  const re = new RegExp(BOUNDARY_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    boundaries.push(m.index + m[0].length);
  }
  boundaries.push(text.length);

  const out: { text: string; start: number; end: number }[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const s = text.slice(boundaries[i], boundaries[i + 1]).trim();
    if (s.length > 0) {
      out.push({ text: s, start: boundaries[i], end: boundaries[i + 1] });
    }
  }
  return out;
}

// ── Main handler ─────────────────────────────────────────────────

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { text, lemmaMap } = e.data;

  try {
    // 1. Tokenize
    post("tokenizing", 5);
    const tokens: { word: string; index: number }[] = [];
    const re = new RegExp(WORD_RE.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      tokens.push({ word: m[0].toLowerCase(), index: m.index });
    }

    if (tokens.length === 0) {
      self.postMessage({
        type: "result",
        lemmas: [],
        totalWords: 0,
        uniqueLemmasBeforeFilter: 0,
      } satisfies ResultMsg);
      return;
    }

    // 2. Count raw form frequencies
    post("counting", 15);
    const formCounts = new Map<string, number>();
    for (const t of tokens) {
      formCounts.set(t.word, (formCounts.get(t.word) ?? 0) + 1);
    }

    // 3. Extract chapters
    post("chapters", 25);
    const chapters = findChapters(text);

    // 4. Split into sentences & map tokens to sentences
    post("sentences", 35);
    const sentences = splitSentences(text);

    // Two-pointer: map each token index to its sentence index
    const tokenSentence = new Uint32Array(tokens.length);
    let si = 0;
    for (let ti = 0; ti < tokens.length; ti++) {
      while (
        si < sentences.length - 1 &&
        sentences[si + 1].start <= tokens[ti].index
      ) {
        si++;
      }
      tokenSentence[ti] = si;
    }

    // Build word-form -> Set<sentence-index>
    post("indexing", 50);
    const wordToSentences = new Map<string, Set<number>>();
    for (let ti = 0; ti < tokens.length; ti++) {
      const { word } = tokens[ti];
      const sx = tokenSentence[ti];
      let sset = wordToSentences.get(word);
      if (!sset) {
        sset = new Set<number>();
        wordToSentences.set(word, sset);
      }
      sset.add(sx);
    }

    // 5. Lemmatize: merge form counts under base lemmas
    post("lemmatizing", 65);
    const lemmaAgg = new Map<
      string,
      { total: number; forms: Map<string, number> }
    >();

    for (const [form, count] of formCounts) {
      const lemma = lemmaMap[form] ?? form; // ponytail: nullish coalesce, form is own lemma if unmapped
      let entry = lemmaAgg.get(lemma);
      if (!entry) {
        entry = { total: 0, forms: new Map() };
        lemmaAgg.set(lemma, entry);
      }
      entry.total += count;
      entry.forms.set(form, count);
    }

    // 6. Collect example sentences per lemma
    post("examples", 85);

    // Pre-compute sentence chapter labels (lazy per sentence)
    const sentChapters: (string | undefined)[] = new Array(sentences.length);
    for (let i = 0; i < sentences.length; i++) {
      sentChapters[i] = chapterFor(sentences[i].start, chapters);
    }

    const lemmas: LemmaBlock[] = [];
    for (const [lemma, agg] of lemmaAgg) {
      // Union sentence indices across all forms of this lemma
      const candidateSet = new Set<number>();
      for (const form of agg.forms.keys()) {
        const sset = wordToSentences.get(form);
        if (sset) for (const idx of sset) candidateSet.add(idx);
      }

      // Score candidates: prefer exact lemma match, prefer shorter, reward chapter diversity
      const lemmaLower = lemma.toLowerCase();
      // ponytail: word-boundary regex to avoid substring false positives
      // ("be" matching "because", "or" matching "for", etc.)
      const escaped = lemmaLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const lemmaWordRe = new RegExp(`\\b${escaped}\\b`, "i");
      const scored = Array.from(candidateSet).map((sx) => {
        let score = 0;
        if (lemmaWordRe.test(sentences[sx].text)) score += 1000;
        score += Math.max(0, 200 - sentences[sx].text.length);
        return { sx, score };
      });
      scored.sort((a, b) => b.score - a.score);

      // Pick up to 3, preferring different chapters
      const usedChapters = new Set<string>();
      const examples: { text: string; chapter?: string }[] = [];

      for (const { sx } of scored) {
        if (examples.length >= 3) break;
        const ch = sentChapters[sx];
        if (!ch || !usedChapters.has(ch)) {
          examples.push({ text: sentences[sx].text, chapter: ch });
          if (ch) usedChapters.add(ch);
        }
      }
      // Fill remaining slots with any candidate
      for (const { sx } of scored) {
        if (examples.length >= 3) break;
        const txt = sentences[sx].text;
        if (!examples.some((ex) => ex.text === txt)) {
          examples.push({ text: txt, chapter: sentChapters[sx] });
        }
      }

      const forms = Array.from(agg.forms.entries())
        .map(([form, count]) => ({ form, count }))
        .sort((a, b) => b.count - a.count);

      lemmas.push({ lemma, totalCount: agg.total, forms, examples });
    }

    // Sort by frequency descending
    lemmas.sort((a, b) => b.totalCount - a.totalCount);

    self.postMessage({
      type: "result",
      lemmas,
      totalWords: tokens.length,
      uniqueLemmasBeforeFilter: lemmas.length,
    } satisfies ResultMsg);
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    } satisfies ErrorMsg);
  }
};
