"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { FileDown, Loader2, AlertTriangle } from "lucide-react";
import type { WordResult, StopwordsLevel } from "@/types";
import { WordFrequencyPDF } from "@/lib/pdf-template";
import { useI18n } from "@/lib/i18n";

const MAX_PDF_RESULTS = 2000;

type Props = {
  results: WordResult[];
  fileName: string;
  totalWords: number;
  uniqueLemmas: number;
  coveragePercent: number;
  stopwordsLevel: StopwordsLevel;
  activeTags: string[];
};

export function ExportPdfButton({
  results,
  fileName,
  totalWords,
  uniqueLemmas,
  coveragePercent,
  stopwordsLevel,
  activeTags,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, locale } = useI18n();
  const exceedsLimit = results.length > MAX_PDF_RESULTS;

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await pdf(
        <WordFrequencyPDF
          results={results}
          fileName={fileName}
          totalWords={totalWords}
          uniqueLemmas={uniqueLemmas}
          coveragePercent={coveragePercent}
          locale={locale}
          stopwordsLevel={stopwordsLevel}
          activeTags={activeTags}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `word-frequency-${fileName.replace(/\.txt$/i, "")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("exportPdf.error"));
    } finally {
      setLoading(false);
    }
  };

  if (results.length === 0) return null;

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink bg-white border border-warm-300 rounded-lg hover:bg-warm-50 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
        {loading ? t("exportPdf.generating") : t("exportPdf.button")}
      </button>
      {exceedsLimit && (
        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          {results.length.toLocaleString()} results — PDF will show first{" "}
          {MAX_PDF_RESULTS.toLocaleString()} for performance.
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-1.5">{error}</p>
      )}
    </div>
  );
}
