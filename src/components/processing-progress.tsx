"use client";

import { useState, useEffect } from "react";
import type { AnalysisPhase } from "@/types";
import { useI18n } from "@/lib/i18n";

type Props = {
  phase: AnalysisPhase;
  progress: number;
};

export function ProcessingProgress({ phase, progress }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const { t } = useI18n();

  useEffect(() => {
    if (phase === "idle" || phase === "done" || phase === "error") return;
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 200);
    return () => clearInterval(timer);
  }, [phase]);

  if (phase === "idle" || phase === "done" || phase === "error") return null;

  const PHASE_LABELS: Record<AnalysisPhase, string> = {
    idle: t("phase.waiting"),
    reading: t("phase.reading"),
    analyzing: t("phase.analyzing"),
    "loading-dicts": t("phase.loadingDicts"),
    merging: t("phase.merging"),
    done: t("phase.done"),
    error: t("phase.error"),
  };

  const PHASE_TIPS: Partial<Record<AnalysisPhase, string>> = {
    reading: t("phase.tip.reading"),
    analyzing: t("phase.tip.analyzing"),
    "loading-dicts": t("phase.tip.loadingDicts"),
    merging: t("phase.tip.merging"),
  };

  const label = PHASE_LABELS[phase];
  const tip = PHASE_TIPS[phase];

  return (
    <div className="w-full max-w-md mx-auto py-12 flex flex-col items-center gap-5">
      {/* progress bar */}
      <div className="w-full h-1.5 bg-warm-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: "var(--brand-gradient)",
          }}
        />
      </div>

      {/* phase label with elapsed time */}
      <div className="flex items-center gap-2.5 text-sm text-warm-500">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600" />
        </span>
        <span>
          {label}
          <span className="text-warm-400 ml-1.5">{elapsed}s</span>
        </span>
      </div>

      {/* phase tip */}
      {tip && (
        <p className="text-xs text-warm-400 text-center max-w-xs">{tip}</p>
      )}
    </div>
  );
}
