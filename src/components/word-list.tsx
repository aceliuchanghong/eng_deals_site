"use client";

import { useState, useEffect } from "react";
import { ArrowUp, SearchX } from "lucide-react";
import type { WordResult } from "@/types";
import { useI18n } from "@/lib/i18n";
import { WordCard } from "./word-card";

type Props = {
  results: WordResult[];
};

export function WordList({ results }: Props) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-warm-400 gap-4">
        <div className="w-14 h-14 rounded-xl bg-warm-100 flex items-center justify-center">
          <SearchX className="w-7 h-7 text-warm-400" />
        </div>
        <p className="text-sm font-medium text-warm-500">{t("wordList.empty")}</p>
        <p className="text-xs text-warm-300 max-w-xs text-center">
          {t("wordList.emptyHint")}
        </p>
      </div>
    );
  }

  const maxCount = results[0]?.totalCount ?? 1;

  return (
    <>

      <div className="border border-warm-200 rounded-lg overflow-hidden">
        {results.map((r, i) => (
          <div key={r.lemma} style={{ contentVisibility: "auto", containIntrinsicSize: "0 52px" }}>
            <WordCard result={r} rank={i + 1} maxCount={maxCount} />
          </div>
        ))}
      </div>

      {/* scroll-to-top button - always rendered, animated visibility */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 w-10 h-10 bg-white border border-warm-200 rounded-full flex items-center justify-center shadow-sm hover:bg-warm-50 transition-all duration-300 ${
          showScrollTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label={t("wordList.scrollTop")}
      >
        <ArrowUp className="w-4 h-4 text-warm-600" />
      </button>
    </>
  );
}
