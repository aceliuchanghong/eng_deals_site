import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { WordResult, StopwordsLevel } from "@/types";
import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";
import { TAG_LABELS } from "@/lib/utils";

// ── Font registration ────────────────────────────────────────────

const origin = typeof window !== "undefined" ? window.location.origin : "";
// Source Han Serif CN: serif, full CJK + Latin + IPA coverage
Font.register({
  family: "Source Han Serif CN",
  fonts: [
    { src: `${origin}/fonts/SourceHanSerifCN-Regular.ttf`, fontWeight: 400 },
    { src: `${origin}/fonts/SourceHanSerifCN-SemiBold.ttf`, fontWeight: 600 },
  ],
});

// ── Colours ─────────────────────────────────────────────────────

const C = {
  ink: "#1a1817",
  red: "#C62828",
  blue: "#1565C0",
  blueBg: "#E3F2FD",
  green: "#2E7D32",
  purple: "#7B6D8D",
  gray: "#9E9E9E",
  rule: "#E0E0E0",
  white: "#FFFFFF",
  bg: "#FAFAFA",
};

// ── Layout constants ─────────────────────────────────────────────

const ENTRIES_PER_PAGE = 40; // 20 per column at 8pt — ~78% page fill for mixed entries
const MAX_RESULTS = 2000;

// ── Translation parser ──────────────────────────────────────────

/** POS pattern: common English part-of-speech abbreviations */
const POS_RE = /^(n\.|v\.|vt\.|vi\.|adj\.|adv\.|prep\.|conj\.|pron\.|art\.|num\.|int\.|abbr\.|a\.|aux\.|det\.|interj\.)\s+/i;
const CJK_RE = /[一-鿿㐀-䶿]/;

interface ParsedDef {
  pos: string;       // e.g. "n."
  chinese: string;   // primary Chinese meaning
}

interface ParsedTranslation {
  primary: ParsedDef | null;
  supplementary: string[]; // field-tagged lines like [计] 地址总线
  english: string[];       // English-only definitions
}

function parseTranslation(raw: string | null): ParsedTranslation {
  if (!raw) return { primary: null, supplementary: [], english: [] };

  // ECDICT stores literal \n (backslash+n, two chars), not actual newlines
  const lines = raw.split(/\\n|\n/).map((l) => l.trim()).filter(Boolean);
  const result: ParsedTranslation = { primary: null, supplementary: [], english: [] };

  for (const line of lines) {
    const m = line.match(POS_RE);
    if (m) {
      const rest = line.slice(m[0].length).trim();
      if (CJK_RE.test(rest)) {
        // Contains Chinese → Chinese definition
        if (!result.primary) {
          result.primary = { pos: m[1], chinese: rest };
        } else {
          result.supplementary.push(line);
        }
      } else {
        // Latin-only → English definition
        result.english.push(line);
      }
    } else {
      // No POS marker → field-tagged supplementary like [计] 地址总线
      result.supplementary.push(line);
    }
  }

  return result;
}

// ── Styles ──────────────────────────────────────────────────────

const S = StyleSheet.create({
  // Page
  page: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 20,
    paddingRight: 20,
    fontFamily: "Source Han Serif CN", fontWeight: 400,
    fontSize: 8,
    color: C.ink,
    backgroundColor: C.white,
    flexDirection: "column",
  },

  // ── Cover page ──────────────────────────────────────────────

  cover: { flex: 1, justifyContent: "center", alignItems: "center" },
  coverTitle: { fontSize: 26, fontFamily: "Source Han Serif CN", fontWeight: 600, color: C.ink, letterSpacing: 4, textTransform: "uppercase" },
  coverSub: { fontSize: 9, color: C.gray, letterSpacing: 2, textTransform: "uppercase", marginTop: 6, marginBottom: 24 },
  coverLine: { width: "25%", height: 1.5, backgroundColor: C.ink, marginBottom: 20 },
  coverFile: { fontSize: 13, fontFamily: "Source Han Serif CN", fontWeight: 600, color: C.ink },
  coverDate: { fontSize: 9, color: C.gray, marginTop: 4, marginBottom: 32 },
  coverStats: { flexDirection: "row", justifyContent: "center", gap: 0, marginBottom: 16 },
  coverStatBox: { alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: C.rule, marginHorizontal: 4, width: "25%" },
  coverStatNum: { fontSize: 20, fontFamily: "Source Han Serif CN", fontWeight: 600, color: C.ink },
  coverStatLabel: { fontSize: 7, color: C.gray, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 },
  coverFilters: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 4 },
  coverPill: { fontSize: 7, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: C.rule, textTransform: "uppercase", color: C.gray },
  coverPillOn: { borderColor: C.blue, color: C.blue, backgroundColor: C.blueBg },

  // ── Page header ──────────────────────────────────────────────

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 4,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.rule,
  },
  headerRange: { fontSize: 7.5, fontFamily: "Source Han Serif CN", fontWeight: 600, color: C.ink },
  headerPage: { fontSize: 7.5, fontFamily: "Source Han Serif CN", fontWeight: 400, color: C.gray },

  // ── Two-column container ─────────────────────────────────────

  columns: {
    flexDirection: "row",
    flex: 1,
  },
  column: {
    flex: 1,
    paddingRight: 6,
  },
  columnDivider: {
    width: 1,
    backgroundColor: C.rule,
    marginHorizontal: 6,
  },

  // ── Entry ────────────────────────────────────────────────────

  entry: {
    marginBottom: 3,
    paddingBottom: 2,
  },

  // Headword row
  headwordRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    marginBottom: 0.5,
  },
  rankBracket: {
    fontSize: 7,
    fontFamily: "Source Han Serif CN", fontWeight: 600,
    color: C.red,
  },
  headword: {
    fontSize: 9.5,
    fontFamily: "Source Han Serif CN", fontWeight: 600,
    color: C.ink,
    marginRight: 3,
  },
  phonetic: {
    fontSize: 7,
    fontFamily: "Source Han Serif CN", fontWeight: 400,
    color: C.gray,
    marginRight: 4,
  },
  tagBox: {
    fontSize: 5.5,
    fontFamily: "Source Han Serif CN", fontWeight: 600,
    color: C.blue,
    backgroundColor: C.blueBg,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginRight: 3,
    borderRadius: 1,
  },
  freqText: {
    fontSize: 6.5,
    color: C.gray,
    fontFamily: "Source Han Serif CN", fontWeight: 400,
  },

  // Chinese definition row
  chineseRow: {
    marginBottom: 0.5,
    paddingLeft: 12,
  },
  chinesePos: {
    fontSize: 7.5,
    fontFamily: "Source Han Serif CN", fontWeight: 600,
    color: C.green,
  },
  chineseDef: {
    fontSize: 7.5,
    fontFamily: "Source Han Serif CN", fontWeight: 400,
    color: C.green,
  },

  // Supplementary definition row
  suppRow: {
    marginBottom: 0.5,
    paddingLeft: 12,
  },
  suppText: {
    fontSize: 7,
    fontFamily: "Source Han Serif CN", fontWeight: 400,
    color: C.purple,
  },

  // Example section
  exampleSection: {
    marginTop: 1,
    paddingLeft: 12,
  },
  exampleLabel: {
    fontSize: 6.5,
    fontFamily: "Source Han Serif CN",
    fontWeight: 600,
    color: C.ink,
    marginBottom: 0.5,
  },
  exampleText: {
    fontSize: 7,
    fontFamily: "Source Han Serif CN", fontWeight: 400,
    color: C.ink,
    lineHeight: 1.3,
  },
  exampleSource: {
    fontSize: 6.5,
    fontFamily: "Source Han Serif CN", fontWeight: 400,
    color: C.gray,
  },

  // Forms display
  formsRow: {
    marginTop: 0.5,
    paddingLeft: 12,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  formsLabel: {
    fontSize: 6,
    fontFamily: "Source Han Serif CN",
    fontWeight: 600,
    color: C.gray,
  },
  formsText: {
    fontSize: 6,
    fontFamily: "Source Han Serif CN", fontWeight: 400,
    color: C.gray,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 12,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: C.rule,
    paddingTop: 4,
  },
  footerText: { fontSize: 6, color: C.gray },
});

// ── Components ──────────────────────────────────────────────────

function PageHeader({ start, end, page }: { start: number; end: number; page: number }) {
  return (
    <View fixed style={S.header}>
      <Text style={S.headerRange}>{start} - {end}</Text>
      <Text style={S.headerPage}>{page}</Text>
    </View>
  );
}

function WordEntry({ word, index }: { word: WordResult; index: number }) {
  const parsed = parseTranslation(word.translation);
  const phonetic = cleanPhonetic(word.phonetic);
  const hasExamples = word.examples && word.examples.length > 0;
  const hasForms = word.forms && word.forms.length > 1;

  return (
    <View style={S.entry} wrap={false}>
      {/* Headword row: [752] abolish /əˈbɒlɪʃ/ [CET4] 6次 */}
      <View style={S.headwordRow}>
        <Text style={S.rankBracket}>[{index}] </Text>
        <Text style={S.headword}>{word.lemma}</Text>
        {phonetic ? <Text style={S.phonetic}>{phonetic} </Text> : null}
        {word.tags.map((tag) => (
          <Text key={tag} style={S.tagBox}>{TAG_LABELS[tag] ?? tag}</Text>
        ))}
        <Text style={S.freqText}> {word.totalCount}次</Text>
      </View>

      {/* Chinese definition: n. 废除；取消 (green) */}
      {parsed.primary ? (
        <View style={S.chineseRow}>
          <Text style={S.chinesePos}>{parsed.primary.pos} </Text>
          <Text style={S.chineseDef}>{parsed.primary.chinese}</Text>
        </View>
      ) : null}

      {/* English definitions: n. single thickness of... (purple-gray) */}
      {parsed.english.map((en, i) => (
        <View key={`en-${i}`} style={S.suppRow}>
          <Text style={S.suppText}>{en}</Text>
        </View>
      ))}

      {/* Supplementary: [计] 地址总线 (purple-gray) */}
      {parsed.supplementary.map((s, i) => (
        <View key={`sup-${i}`} style={S.suppRow}>
          <Text style={S.suppText}>{s}</Text>
        </View>
      ))}

      {/* Examples */}
      {hasExamples ? (
        <View style={S.exampleSection}>
          <Text style={S.exampleLabel}>[例句]</Text>
          {word.examples.slice(0, 2).map((ex, i) => (
            <View key={i}>
              <Text style={S.exampleText}>
                {ex.text}
                {ex.chapter ? (
                  <Text style={S.exampleSource}> -{ex.chapter}</Text>
                ) : null}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Word forms */}
      {hasForms ? (
        <View style={S.formsRow}>
          <Text style={S.formsLabel}>[词形] </Text>
          <Text style={S.formsText}>
            {word.forms.slice(0, 5).map((f) => `${f.form}(${f.count})`).join(" ")}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function CoverPage({
  fileName, date, totalWords, uniqueLemmas, activeTags, t,
}: {
  fileName: string; date: string; totalWords: number; uniqueLemmas: number;
  activeTags: string[]; t: (k: string) => string;
}) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.cover}>
        <Text style={S.coverTitle}>LexiLoom</Text>
        <Text style={S.coverSub}>{t("header.subtitle")}</Text>
        <View style={S.coverLine} />
        <Text style={S.coverFile}>{fileName}</Text>
        <Text style={S.coverDate}>{date}</Text>

        <View style={S.coverStats}>
          <View style={S.coverStatBox}>
            <Text style={S.coverStatNum}>{totalWords.toLocaleString()}</Text>
            <Text style={S.coverStatLabel}>{t("stats.totalWords")}</Text>
          </View>
          <View style={S.coverStatBox}>
            <Text style={S.coverStatNum}>{uniqueLemmas.toLocaleString()}</Text>
            <Text style={S.coverStatLabel}>{t("stats.uniqueLemmas")}</Text>
          </View>
        </View>

        {activeTags.length > 0 ? (
          <View style={S.coverFilters}>
            {activeTags.map((tag) => (
              <Text key={tag} style={[S.coverPill, S.coverPillOn]}>{TAG_LABELS[tag] ?? tag}</Text>
            ))}
          </View>
        ) : null}
      </View>

      <View fixed style={S.footer}>
        <Text style={S.footerText}>LexiLoom</Text>
        <Text style={S.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  );
}

// ── Helpers ─────────────────────────────────────────────────────

function cleanPhonetic(p: string | null): string {
  if (!p) return "";
  const raw = p.replace(/^\/+|\/+$/g, "").trim();
  return raw ? `/${raw}/` : "";
}

// ── Main ────────────────────────────────────────────────────────

type Props = {
  results: WordResult[];
  fileName: string;
  totalWords: number;
  uniqueLemmas: number;
  coveragePercent: number;
  locale: Locale;
  stopwordsLevel: StopwordsLevel;
  activeTags: string[];
};

export function WordFrequencyPDF({
  results, fileName, totalWords, uniqueLemmas, locale, activeTags,
}: Props) {
  const t = (key: string) => translate(key, locale);

  const date = new Date().toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const display = results.length > MAX_RESULTS ? results.slice(0, MAX_RESULTS) : results;

  // Chunk into pages
  const pages: WordResult[][] = [];
  for (let i = 0; i < display.length; i += ENTRIES_PER_PAGE) {
    pages.push(display.slice(i, i + ENTRIES_PER_PAGE));
  }

  return (
    <Document>
      {/* Cover page */}
      <CoverPage
        fileName={fileName} date={date} totalWords={totalWords}
        uniqueLemmas={uniqueLemmas} activeTags={activeTags} t={t}
      />

      {/* Vocabulary pages */}
      {pages.map((pageWords, pageIdx) => {
        const mid = Math.ceil(pageWords.length / 2);
        const leftWords = pageWords.slice(0, mid);
        const rightWords = pageWords.slice(mid);

        const globalStart = pageIdx * ENTRIES_PER_PAGE + 1;
        const globalEnd = globalStart + pageWords.length - 1;

        return (
          <Page key={pageIdx} size="A4" style={S.page}>
            <PageHeader start={globalStart} end={globalEnd} page={pageIdx + 1} />

            <View style={S.columns}>
              {/* Left column */}
              <View style={S.column}>
                {leftWords.map((w, i) => (
                  <WordEntry key={w.lemma} word={w} index={globalStart + i} />
                ))}
              </View>

              {/* Divider */}
              <View style={S.columnDivider} />

              {/* Right column */}
              <View style={S.column}>
                {rightWords.map((w, i) => (
                  <WordEntry key={w.lemma} word={w} index={globalStart + mid + i} />
                ))}
              </View>
            </View>

            <View fixed style={S.footer}>
              <Text style={S.footerText}>LexiLoom</Text>
              <Text style={S.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
