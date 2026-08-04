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

// ── Font registration ────────────────────────────────────────────────
// Helvetica / Helvetica-Bold / Courier are built into react-pdf.
// Noto Sans SC covers Chinese characters in the translation column.

Font.register({
  family: "Noto Sans SC",
  fonts: [
    { src: "/fonts/NotoSansSC-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/NotoSansSC-Bold.ttf", fontWeight: 700 },
  ],
});

// ── Brand palette ─────────────────────────────────────────────────────

const C = {
  brand: "#1a3fb5",
  brandDark: "#163192",
  brandLight: "#e8f0fe",
  ink: "#1a1817",
  warm50: "#faf8f5",
  warm100: "#f5efe8",
  warm200: "#e8ddd0",
  warm400: "#8b6b4e",
  warm500: "#725844",
  white: "#ffffff",
  muted: "#78716c",
};

// ── Per-exam tag colours (light bg + coordinating text) ──────────────

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  cet4: { bg: "#e8f0fe", text: C.brand },
  cet6: { bg: "#e8eaf6", text: "#283593" },
  tem4: { bg: "#f3e5f5", text: "#6a1b9a" },
  tem8: { bg: "#ede7f6", text: "#4527a0" },
  toefl: { bg: "#e8f5e9", text: "#2e7d32" },
  ielts: { bg: "#fff8e1", text: "#f57f17" },
  gre: { bg: "#fce4ec", text: "#c62828" },
};

const MAX_RESULTS = 2000;

// ── Helpers ───────────────────────────────────────────────────────────

function truncate(s: string, maxLen = 48): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + "…"; // ellipsis
}

function stopwordsLabel(level: StopwordsLevel, t: (k: string) => string): string {
  if (level === "none") return t("filters.none");
  if (level === "strong") return t("filters.strong");
  return t("filters.basic");
}

// ── Styles ────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  /* ── Shared page ─────────────────────────────────────────────── */
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.ink,
    backgroundColor: C.white,
  },

  /* ── Page footer (fixed on every page) ───────────────────────── */
  pageFooter: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.warm200,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: C.warm400 },

  /* ── Cover ───────────────────────────────────────────────────── */
  coverCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  brand: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
    letterSpacing: 6,
    textTransform: "uppercase",
  },
  coverSubtitle: {
    fontSize: 10,
    color: C.warm500,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 28,
  },
  dividerLine: {
    width: "30%",
    height: 2,
    backgroundColor: C.brand,
    marginBottom: 24,
  },
  fileName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    marginBottom: 4,
  },
  coverDate: {
    fontSize: 10,
    color: C.warm400,
    marginBottom: 40,
  },

  /* ── Stats row ───────────────────────────────────────────────── */
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 28,
  },
  statCard: {
    width: "28%",
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.warm200,
    marginHorizontal: 6,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
  },
  statLabel: {
    fontSize: 7,
    color: C.warm400,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  /* ── Filter row ──────────────────────────────────────────────── */
  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  filterPill: {
    fontSize: 7,
    color: C.warm400,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.warm200,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterPillActive: {
    borderColor: C.brand,
    color: C.brand,
    backgroundColor: C.brandLight,
  },
  truncationNote: {
    fontSize: 8,
    color: C.muted,
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },

  /* ── Table header ────────────────────────────────────────────── */
  tablePage: {
    padding: 48,
    paddingTop: 20,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.ink,
    backgroundColor: C.white,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.brand,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: C.white,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  /* ── Table rows ──────────────────────────────────────────────── */
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.warm200,
    paddingVertical: 5,
    paddingHorizontal: 8,
    minHeight: 22,
  },
  tableRowAlt: { backgroundColor: C.warm50 },

  /* ── Columns ─────────────────────────────────────────────────── */
  colRank: {
    width: "5%",
    textAlign: "right",
    paddingRight: 6,
    fontSize: 7,
    color: C.warm400,
  },
  colWord: {
    width: "20%",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  colPhonetic: {
    width: "18%",
    fontSize: 7,
    fontFamily: "Courier",
    color: C.warm500,
  },
  colTranslation: {
    width: "25%",
    fontSize: 8,
    fontFamily: "Noto Sans SC",
    paddingRight: 4,
  },
  colTags: { width: "20%", fontSize: 7 },
  colFreq: { width: "12%", textAlign: "right", fontSize: 9 },

  /* ── Tag badge ───────────────────────────────────────────────── */
  tagBadge: {
    fontSize: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginRight: 3,
    marginBottom: 2,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
});

// ── Sub-components ────────────────────────────────────────────────────

function CoverPage({
  fileName,
  date,
  totalWords,
  uniqueLemmas,
  coveragePercent,
  stopwordsLevel,
  activeTags,
  truncated,
  t,
}: {
  fileName: string;
  date: string;
  totalWords: number;
  uniqueLemmas: number;
  coveragePercent: number;
  stopwordsLevel: StopwordsLevel;
  activeTags: string[];
  truncated: boolean;
  t: (key: string) => string;
}) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.coverCenter}>
        {/* Branding */}
        <Text style={S.brand}>LexiLoom</Text>
        <Text style={S.coverSubtitle}>Word Frequency Analysis</Text>
        <View style={S.dividerLine} />
        <Text style={S.fileName}>{fileName}</Text>
        <Text style={S.coverDate}>{t("pdf.generatedOn")} {date}</Text>

        {/* Stats */}
        <View style={S.statsRow}>
          <View style={S.statCard}>
            <Text style={S.statValue}>{totalWords.toLocaleString()}</Text>
            <Text style={S.statLabel}>{t("stats.totalWords")}</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statValue}>{uniqueLemmas.toLocaleString()}</Text>
            <Text style={S.statLabel}>{t("stats.uniqueLemmas")}</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statValue}>{coveragePercent}%</Text>
            <Text style={S.statLabel}>{t("stats.dictCoverage")}</Text>
          </View>
        </View>

        {/* Filter info */}
        <View style={S.filterRow}>
          <Text
            style={[
              S.filterPill,
              stopwordsLevel === "none" ? {} : S.filterPillActive,
            ]}
          >
            {t("filters.stopwords")}: {stopwordsLabel(stopwordsLevel, t)}
          </Text>
          {activeTags.length === 0 ? (
            <Text style={S.filterPill}>All Exam Tags</Text>
          ) : (
            activeTags.map((tag) => (
              <Text key={tag} style={[S.filterPill, S.filterPillActive]}>
                {TAG_LABELS[tag] ?? tag}
              </Text>
            ))
          )}
        </View>

        {truncated && (
          <Text style={S.truncationNote}>
            Showing first {MAX_RESULTS.toLocaleString()} results (of all
            matching words)
          </Text>
        )}
      </View>

      {/* Footer */}
      <View fixed style={S.pageFooter}>
        <Text style={S.footerText}>LexiLoom</Text>
        <Text
          style={S.footerText}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>
    </Page>
  );
}

function TablePage({
  results,
  t,
}: {
  results: WordResult[];
  t: (key: string) => string;
}) {
  return (
    <Page size="A4" style={S.tablePage} wrap>
      {/* Table header — fixed repeats on every page */}
      <View fixed>
        <View style={S.tableHeader}>
          <Text style={[S.th, S.colRank]}>#</Text>
          <Text style={[S.th, S.colWord]}>{t("pdf.colWord")}</Text>
          <Text style={[S.th, S.colPhonetic]}>{t("pdf.colPhonetic")}</Text>
          <Text style={[S.th, S.colTranslation]}>
            {t("pdf.colTranslation")}
          </Text>
          <Text style={[S.th, S.colTags]}>{t("pdf.colTags")}</Text>
          <Text style={[S.th, S.colFreq]}>{t("pdf.colFreq")}</Text>
        </View>
      </View>

      {/* Table body */}
      {results.map((row, idx) => (
        <View
          style={[S.tableRow, idx % 2 === 0 ? S.tableRowAlt : {}]}
          key={row.lemma}
          wrap={false}
        >
          <Text style={S.colRank}>{idx + 1}</Text>
          <Text style={S.colWord}>{row.lemma}</Text>
          <Text style={S.colPhonetic}>{row.phonetic ?? ""}</Text>
          <Text style={S.colTranslation}>
            {row.translation ? truncate(row.translation, 48) : ""}
          </Text>
          <View style={S.colTags}>
            {row.tags.length > 0 && (
              <View style={S.tagsWrap}>
                {row.tags.map((tag) => {
                  const c = TAG_COLORS[tag] ?? { bg: C.warm100, text: C.warm500 };
                  return (
                    <Text
                      key={tag}
                      style={[
                        S.tagBadge,
                        { backgroundColor: c.bg, color: c.text },
                      ]}
                    >
                      {TAG_LABELS[tag] ?? tag}
                    </Text>
                  );
                })}
              </View>
            )}
          </View>
          <Text style={S.colFreq}>{row.totalCount.toLocaleString()}</Text>
        </View>
      ))}

      {/* Footer */}
      <View fixed style={S.pageFooter}>
        <Text style={S.footerText}>LexiLoom</Text>
        <Text
          style={S.footerText}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>
    </Page>
  );
}

// ── Main component ────────────────────────────────────────────────────

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
  results,
  fileName,
  totalWords,
  uniqueLemmas,
  coveragePercent,
  locale,
  stopwordsLevel,
  activeTags,
}: Props) {
  const t = (key: string) => translate(key, locale);

  const date = new Date().toLocaleDateString(
    locale === "zh" ? "zh-CN" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  // ponytail: cap results at MAX_RESULTS to keep PDF generation fast;
  // increase the cap if users routinely need larger exports.
  const truncated = results.length > MAX_RESULTS;
  const display = truncated ? results.slice(0, MAX_RESULTS) : results;

  return (
    <Document>
      <CoverPage
        fileName={fileName}
        date={date}
        totalWords={totalWords}
        uniqueLemmas={uniqueLemmas}
        coveragePercent={coveragePercent}
        stopwordsLevel={stopwordsLevel}
        activeTags={activeTags}
        truncated={truncated}
        t={t}
      />
      {display.length > 0 && <TablePage results={display} t={t} />}
    </Document>
  );
}
