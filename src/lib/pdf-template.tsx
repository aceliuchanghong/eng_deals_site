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

// Register Noto Sans SC for CJK — use absolute URL so @react-pdf/renderer can fetch
const origin = typeof window !== "undefined" ? window.location.origin : "";
Font.register({
  family: "Noto Sans SC",
  fonts: [
    { src: `${origin}/fonts/NotoSansSC-Regular.ttf`, fontWeight: 400 },
    { src: `${origin}/fonts/NotoSansSC-Bold.ttf`, fontWeight: 700 },
  ],
});

// ── Brand colours ─────────────────────────────────────────────────

const B = {
  ink: "#1a1817",
  soft: "#8b6b4e",
  rule: "#e8ddd0",
  bg: "#faf8f5",
  white: "#ffffff",
  brand: "#1a3fb5",
};

const MAX_RESULTS = 2000;

// ── Helpers ───────────────────────────────────────────────────────

function cleanPhonetic(p: string | null): string {
  if (!p) return "";
  // Strip any existing slashes to avoid double-wrapping
  const raw = p.replace(/^\/+|\/+$/g, "").trim();
  return raw ? `/${raw}/` : "";
}

function cleanTranslation(t: string | null): string {
  if (!t) return "";
  return t.replace(/\\n/g, " · ").replace(/\s+/g, " ").slice(0, 60);
}

function stopwordsLabel(level: StopwordsLevel, t: (k: string) => string): string {
  if (level === "none") return t("filters.none");
  if (level === "strong") return t("filters.strong");
  return t("filters.basic");
}

// ── Styles ────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: B.ink,
    backgroundColor: B.white,
  },

  // Cover
  cover: { flex: 1, justifyContent: "center", alignItems: "center" },
  coverTitle: { fontSize: 26, fontFamily: "Helvetica-Bold", color: B.brand, letterSpacing: 4, textTransform: "uppercase" },
  coverSub: { fontSize: 9, color: B.soft, letterSpacing: 2, textTransform: "uppercase", marginTop: 6, marginBottom: 24 },
  coverLine: { width: "25%", height: 1.5, backgroundColor: B.brand, marginBottom: 20 },
  coverFile: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  coverDate: { fontSize: 9, color: B.soft, marginTop: 4, marginBottom: 32 },

  // Stats row
  stats: { flexDirection: "row", justifyContent: "center", gap: 0, marginBottom: 20 },
  statBox: { alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: B.rule, marginHorizontal: 4, width: "25%" },
  statNum: { fontSize: 20, fontFamily: "Helvetica-Bold", color: B.ink },
  statLabel: { fontSize: 7, color: B.soft, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 },

  // Filter pills
  filters: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 4, marginBottom: 8 },
  pill: { fontSize: 7, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: B.rule, textTransform: "uppercase", color: B.soft },
  pillOn: { borderColor: B.brand, color: B.brand, backgroundColor: "#e8f0fe" },

  // Table
  tablePage: { padding: 40, paddingTop: 16, fontFamily: "Helvetica", fontSize: 9, color: B.ink, backgroundColor: B.white },
  tHead: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: B.ink, paddingBottom: 5, marginBottom: 2 },
  tHeadText: { fontFamily: "Helvetica-Bold", fontSize: 7.5, textTransform: "uppercase", letterSpacing: 0.5 },
  tRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: B.rule, paddingVertical: 4, alignItems: "center" },
  tRowAlt: { backgroundColor: B.bg },

  // Columns — simple percentage-based, no cramped spacing
  cRank: { width: "6%", textAlign: "right", paddingRight: 8, fontSize: 8, color: B.soft },
  cWord: { width: "22%", fontFamily: "Helvetica-Bold", fontSize: 9.5 },
  cPhonetic: { width: "20%", fontSize: 7.5, fontFamily: "Courier", color: B.soft },
  cTrans: { width: "26%", fontSize: 8, fontFamily: "Noto Sans SC", paddingRight: 4 },
  cTags: { width: "16%", fontSize: 7 },
  cFreq: { width: "10%", textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 9.5 },

  // Tag badge
  tag: { fontSize: 6, paddingHorizontal: 3, paddingVertical: 1, marginRight: 2, marginBottom: 2 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },

  // Footer
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: B.rule, paddingTop: 6 },
  footerText: { fontSize: 7, color: B.soft },
});

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  cet4: { bg: "#e8f0fe", text: B.brand },
  cet6: { bg: "#e8eaf6", text: "#283593" },
  tem4: { bg: "#f3e5f5", text: "#6a1b9a" },
  tem8: { bg: "#ede7f6", text: "#4527a0" },
  toefl: { bg: "#e8f5e9", text: "#2e7d32" },
  ielts: { bg: "#fff8e1", text: "#f57f17" },
  gre: { bg: "#fce4ec", text: "#c62828" },
};

// ── Components ────────────────────────────────────────────────────

function CoverPage({
  fileName, date, totalWords, uniqueLemmas, stopwordsLevel, activeTags, truncated, t,
}: {
  fileName: string; date: string; totalWords: number; uniqueLemmas: number;
  stopwordsLevel: StopwordsLevel; activeTags: string[]; truncated: boolean;
  t: (k: string) => string;
}) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.cover}>
        <Text style={S.coverTitle}>LexiLoom</Text>
        <Text style={S.coverSub}>Word Frequency Analysis</Text>
        <View style={S.coverLine} />
        <Text style={S.coverFile}>{fileName}</Text>
        <Text style={S.coverDate}>{date}</Text>

        <View style={S.stats}>
          <View style={S.statBox}>
            <Text style={S.statNum}>{totalWords.toLocaleString()}</Text>
            <Text style={S.statLabel}>{t("stats.totalWords")}</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statNum}>{uniqueLemmas.toLocaleString()}</Text>
            <Text style={S.statLabel}>{t("stats.uniqueLemmas")}</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statNum}>{t("filters.strong")}</Text>
            <Text style={S.statLabel}>{t("filters.stopwords")}</Text>
          </View>
        </View>

        <View style={S.filters}>
          {activeTags.length === 0 ? (
            <Text style={S.pill}>{t("filters.hint").slice(0, 30)}</Text>
          ) : (
            activeTags.map((tag) => (
              <Text key={tag} style={[S.pill, S.pillOn]}>{TAG_LABELS[tag] ?? tag}</Text>
            ))
          )}
        </View>
      </View>

      <View fixed style={S.footer}>
        <Text style={S.footerText}>LexiLoom</Text>
        <Text style={S.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  );
}

function TablePage({ results, t }: { results: WordResult[]; t: (k: string) => string }) {
  return (
    <Page size="A4" style={S.tablePage} wrap>
      <View fixed>
        <View style={S.tHead}>
          <Text style={[S.tHeadText, S.cRank]}>#</Text>
          <Text style={[S.tHeadText, S.cWord]}>{t("pdf.colWord")}</Text>
          <Text style={[S.tHeadText, S.cPhonetic]}>{t("pdf.colPhonetic")}</Text>
          <Text style={[S.tHeadText, S.cTrans]}>{t("pdf.colTranslation")}</Text>
          <Text style={[S.tHeadText, S.cTags]}>{t("pdf.colTags")}</Text>
          <Text style={[S.tHeadText, S.cFreq]}>{t("pdf.colFreq")}</Text>
        </View>
      </View>

      {results.map((row, idx) => (
        <View style={[S.tRow, idx % 2 === 0 ? S.tRowAlt : {}]} key={row.lemma} wrap={false}>
          <Text style={S.cRank}>{idx + 1}</Text>
          <Text style={S.cWord}>{row.lemma}</Text>
          <Text style={S.cPhonetic}>{cleanPhonetic(row.phonetic)}</Text>
          <Text style={S.cTrans}>{cleanTranslation(row.translation)}</Text>
          <View style={S.cTags}>
            {row.tags.length > 0 && (
              <View style={S.tagRow}>
                {row.tags.map((tag) => {
                  const c = TAG_COLORS[tag] ?? { bg: B.bg, text: B.soft };
                  return <Text key={tag} style={[S.tag, { backgroundColor: c.bg, color: c.text }]}>{TAG_LABELS[tag] ?? tag}</Text>;
                })}
              </View>
            )}
          </View>
          <Text style={S.cFreq}>{row.totalCount.toLocaleString()}</Text>
        </View>
      ))}

      <View fixed style={S.footer}>
        <Text style={S.footerText}>LexiLoom</Text>
        <Text style={S.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  );
}

// ── Main ──────────────────────────────────────────────────────────

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

export function WordFrequencyPDF({ results, fileName, totalWords, uniqueLemmas, locale, stopwordsLevel, activeTags }: Props) {
  const t = (key: string) => translate(key, locale);

  const date = new Date().toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const truncated = results.length > MAX_RESULTS;
  const display = truncated ? results.slice(0, MAX_RESULTS) : results;

  return (
    <Document>
      <CoverPage
        fileName={fileName} date={date} totalWords={totalWords}
        uniqueLemmas={uniqueLemmas} stopwordsLevel={stopwordsLevel}
        activeTags={activeTags} truncated={truncated} t={t}
      />
      {display.length > 0 && <TablePage results={display} t={t} />}
    </Document>
  );
}
