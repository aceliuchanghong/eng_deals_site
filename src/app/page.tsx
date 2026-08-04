"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { History, BookOpen, Search, Sparkles, BarChart3, FileText, Play } from "lucide-react";
import type { FilterState, AnalysisRecord } from "@/types";
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

export default function Home() {
  const { phase, setPhase, progress, error, results, setResults, start, cancel } =
    useAnalyzer();
  const [filters, setFilters] = useState<FilterState>({
    stopwordsLevel: "strong",
    activeTags: [],
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(searchQuery), 150);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  const { t, locale, setLocale } = useI18n();

  const [stopwords, setStopwords] = useState<Set<string>>(new Set());
  useEffect(() => {
    fetch("/stopwords/strong.json")
      .then((r) => (r.ok ? (r.json() as Promise<string[]>) : []))
      .then((words) => setStopwords(new Set(words.map((w) => w.toLowerCase()))))
      .catch(() => {});
  }, []);

  const safeResults = results ?? [];

  const tagFiltered = useMemo(
    () => applyFilters(safeResults, stopwords, filters.activeTags),
    [safeResults, filters, stopwords],
  );

  const filteredResults = useMemo(() => {
    if (!debouncedSearch.trim()) return tagFiltered;
    const q = debouncedSearch.toLowerCase().trim();
    return tagFiltered.filter((r) => r.lemma.toLowerCase().includes(q));
  }, [tagFiltered, debouncedSearch]);

  const totalWords = safeResults.reduce((sum, r) => sum + r.totalCount, 0);
  const uniqueLemmas = safeResults.length;

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    setSearchQuery("");
    start(file);
  }, [start]);

  // Demo: fetch test.txt and analyze it
  const handleDemo = useCallback(async () => {
    setDemoLoading(true);
    try {
      const res = await fetch("/test.txt");
      const text = await res.text();
      const file = new File([text], "demo.txt", { type: "text/plain" });
      handleFile(file);
    } catch {
      // ponytail: silently fail, user can still upload manually
    } finally {
      setDemoLoading(false);
    }
  }, [handleFile]);

  const handleLoadRecord = useCallback((record: AnalysisRecord) => {
    setFileName(record.fileName);
    setFilters(record.filters);
    setSearchQuery("");
    setPhase("done");
    setResults(record.results);
    setHistoryOpen(false);
  }, [setResults, setPhase]);

  const handleGoHome = useCallback(() => {
    cancel();
    setFileName("");
    setSearchQuery("");
    setResults(null);
  }, [cancel, setResults]);

  const handleStartOver = useCallback(() => {
    cancel();
    setSearchQuery("");
  }, [cancel]);

  const isIdle = phase === "idle";
  const isProcessing = phase !== "idle" && phase !== "done" && phase !== "error";
  const isDone = phase === "done";

  return (
    <div className="min-h-screen flex flex-col">
      {/* header */}
      <header className="sticky top-0 z-20 border-b border-warm-200/60 bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2.5 hover:opacity-70 transition-opacity"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--brand-gradient)" }}
            >
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="text-left leading-tight">
              <span className="text-sm font-bold font-serif text-ink tracking-tight">
                LexiLoom
              </span>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
              className="text-[11px] font-medium text-warm-400 hover:text-ink transition-colors px-2 py-1 rounded-md hover:bg-warm-100"
            >
              {t("lang.switchTo")}
            </button>
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-warm-400 hover:text-ink transition-colors px-2 py-1 rounded-md hover:bg-warm-100"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("header.history")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* main */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* idle */}
        {isIdle && (
          <div className="flex flex-col items-center gap-6 pt-8 pb-4">
            <h2 className="text-3xl font-serif font-bold text-ink text-center">
              {t("hero.title")}
            </h2>
            <p className="text-sm text-warm-500 max-w-md text-center leading-relaxed -mt-4">
              {t("hero.subtitle")}
            </p>

            <div className="w-full max-w-md">
              <UploadZone onFile={handleFile} />
            </div>

            {/* demo button */}
            <button
              onClick={handleDemo}
              disabled={demoLoading}
              className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {demoLoading ? t("landing.demoLoading") : t("landing.demo")}
            </button>

            {/* steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-6">
              {[
                { icon: FileText, title: t("landing.step1Title"), desc: t("landing.step1Desc") },
                { icon: BarChart3, title: t("landing.step2Title"), desc: t("landing.step2Desc") },
                { icon: Sparkles, title: t("landing.step3Title"), desc: t("landing.step3Desc") },
              ].map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="bg-white border border-warm-200 rounded-xl p-5 text-center hover:shadow-sm transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-5 h-5 text-warm-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-ink mb-1">{step.title}</h3>
                    <p className="text-xs text-warm-400 leading-relaxed">{step.desc}</p>
                  </div>
                );
              })}
            </div>
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
            {error && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700">
                {error}
              </div>
            )}

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <StatsSummary
                totalWords={totalWords}
                uniqueLemmas={uniqueLemmas}
                filteredCount={filteredResults.length}
              />
              <ExportPdfButton
                results={filteredResults}
                fileName={fileName}
                totalWords={totalWords}
                uniqueLemmas={uniqueLemmas}
                coveragePercent={0}
                stopwordsLevel={filters.stopwordsLevel}
                activeTags={filters.activeTags}
              />
            </div>

            <FilterBar filters={filters} onChange={setFilters} />

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

            <WordList results={filteredResults} />
          </div>
        )}
      </main>

      <footer className="border-t border-warm-200 py-4 text-center text-xs text-warm-400">
        <span className="font-serif font-semibold">LexiLoom</span>{" "}
        &middot;{" "}
        {t("footer.tagline")}
      </footer>

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoad={handleLoadRecord}
      />
    </div>
  );
}
