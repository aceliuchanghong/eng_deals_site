"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { History, BookOpen, Search } from "lucide-react";
import type { FilterState, StopwordsLevel, AnalysisRecord } from "@/types";
import { applyFilters } from "@/lib/utils";
import { useAnalyzer } from "@/hooks/use-analyzer";
import { useI18n } from "@/lib/i18n";
import { UploadZone } from "@/components/upload-zone";
import { ProcessingProgress } from "@/components/processing-progress";
import { StatsSummary } from "@/components/stats-summary";
import { FilterBar } from "@/components/filter-bar";
import { WordList } from "@/components/word-list";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { HistoryDrawer } from "@/components/history-drawer";

// ── Page ──────────────────────────────────────────────────────────

export default function Home() {
  const { phase, progress, error, results, setResults, start, cancel } =
    useAnalyzer();
  const [filters, setFilters] = useState<FilterState>({
    stopwordsLevel: "basic",
    activeTags: [],
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { t, locale, setLocale } = useI18n();

  // Stopwords in React state (not module-level cache) so useMemo reacts
  const [stopwords, setStopwords] = useState<
    Record<StopwordsLevel, Set<string>>
  >({
    none: new Set(),
    basic: new Set(),
    strong: new Set(),
  });

  // Load stopwords on mount into state
  useEffect(() => {
    Promise.all([
      fetch("/stopwords/basic.json").then((r) =>
        r.ok ? (r.json() as Promise<string[]>) : [],
      ),
      fetch("/stopwords/strong.json").then((r) =>
        r.ok ? (r.json() as Promise<string[]>) : [],
      ),
    ])
      .then(([basic, strong]) => {
        setStopwords({
          none: new Set(),
          basic: new Set(basic.map((w) => w.toLowerCase())),
          strong: new Set(strong.map((w) => w.toLowerCase())),
        });
      })
      .catch(() => {
        // ponytail: if stopwords fail, filter nothing
      });
  }, []);

  const safeResults = results ?? [];

  // Step 1: apply stopwords + exam tag filters
  const tagFiltered = useMemo(
    () =>
      applyFilters(
        safeResults,
        stopwords[filters.stopwordsLevel],
        filters.activeTags,
      ),
    [safeResults, filters, stopwords],
  );

  // Step 2: apply keyword search on top
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return tagFiltered;
    const q = searchQuery.toLowerCase().trim();
    return tagFiltered.filter((r) => r.lemma.toLowerCase().includes(q));
  }, [tagFiltered, searchQuery]);

  const totalWords = safeResults.reduce((sum, r) => sum + r.totalCount, 0);
  const uniqueLemmas = safeResults.length;
  const coveragePercent =
    safeResults.length > 0
      ? Math.round(
          (safeResults.filter((r) => r.phonetic || r.translation).length /
            safeResults.length) *
            100,
        )
      : 0;

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      setSearchQuery("");
      start(file);
    },
    [start],
  );

  const handleLoadRecord = useCallback(
    (record: AnalysisRecord) => {
      setFileName(record.fileName);
      setFilters(record.filters);
      setSearchQuery("");
      setResults(record.results);
      setHistoryOpen(false);
    },
    [setResults],
  );

  const handleStartOver = useCallback(() => {
    cancel();
    setSearchQuery("");
  }, [cancel]);

  const isIdle = phase === "idle";
  const isProcessing =
    phase !== "idle" && phase !== "done" && phase !== "error";
  const isDone = phase === "done";

  const toggleLocale = () => {
    setLocale(locale === "zh" ? "en" : "zh");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* header */}
      <header className="border-b border-warm-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold font-serif text-ink tracking-tight">
              LexiLoom
            </h1>
            <p className="text-xs text-warm-400">{t("header.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* language toggle */}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1 text-xs font-medium text-warm-500 hover:text-ink transition-colors"
              aria-label={t("lang.switchTo")}
            >
              {t("lang.switchTo")}
            </button>

            {/* history button */}
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-warm-500 hover:text-ink transition-colors"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">{t("header.history")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* main */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* idle: hero */}
        {isIdle && (
          <div className="flex flex-col items-center gap-8 pt-8 pb-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--brand-gradient)" }}
            >
              <BookOpen className="w-9 h-9 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-serif font-bold text-ink">
                LexiLoom
              </h2>
              <p className="text-sm text-warm-500 mt-2 max-w-sm">
                {t("hero.subtitle")}
              </p>
            </div>
            <div className="w-full max-w-md">
              <UploadZone onFile={handleFile} />
            </div>
            <p className="text-xs text-warm-400 italic text-center max-w-xs">
              &ldquo;A word after a word after a word is power.&rdquo;
              <br />
              <span className="not-italic text-warm-300">
                &mdash; Margaret Atwood
              </span>
            </p>
          </div>
        )}

        {/* processing */}
        {isProcessing && (
          <div className="pt-12">
            <h2 className="text-center text-sm font-medium text-warm-600 mb-2">
              {t("processing.analyzing").replace("{filename}", fileName)}
            </h2>
            <ProcessingProgress phase={phase} progress={progress} />
            <div className="text-center mt-4">
              <button
                onClick={cancel}
                className="text-xs text-warm-400 hover:text-warm-600 underline underline-offset-2"
              >
                {t("processing.cancel")}
              </button>
            </div>
          </div>
        )}

        {/* error */}
        {phase === "error" && (
          <div className="pt-12 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 inline-block">
              <p className="text-sm text-red-700 font-medium">
                {error ?? t("error.default")}
              </p>
            </div>
            <button
              onClick={handleStartOver}
              className="mt-4 text-xs text-warm-500 hover:text-ink underline underline-offset-2 block mx-auto"
            >
              {t("error.startOver")}
            </button>
          </div>
        )}

        {/* done: results */}
        {isDone && (
          <div className="space-y-5">
            {/* dict-unavailable warning banner */}
            {error && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700">
                {error}
              </div>
            )}

            {/* stats + export row */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <StatsSummary
                totalWords={totalWords}
                uniqueLemmas={uniqueLemmas}
                coveragePercent={coveragePercent}
                filteredCount={filteredResults.length}
              />
              <ExportPdfButton
                results={filteredResults}
                fileName={fileName}
                totalWords={totalWords}
                uniqueLemmas={uniqueLemmas}
                coveragePercent={coveragePercent}
                stopwordsLevel={filters.stopwordsLevel}
                activeTags={filters.activeTags}
              />
            </div>

            {/* filters */}
            <FilterBar filters={filters} onChange={setFilters} />

            {/* keyword search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="w-full pl-9 pr-4 py-2 text-sm border border-warm-200 rounded-lg bg-white text-ink placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition-shadow"
              />
            </div>

            {/* word list */}
            <WordList results={filteredResults} />
          </div>
        )}
      </main>

      {/* footer */}
      <footer className="border-t border-warm-200 py-4 text-center text-xs text-warm-400">
        <span className="font-serif font-semibold">LexiLoom</span>{" "}
        &middot;{" "}
        {t("footer.tagline")}
      </footer>

      {/* history drawer */}
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoad={handleLoadRecord}
      />
    </div>
  );
}
