"use client";

import { Hash, Bookmark, Filter } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Props = {
  totalWords: number;
  uniqueLemmas: number;
  filteredCount: number;
};

export function StatsSummary({ totalWords, uniqueLemmas, filteredCount }: Props) {
  const { t } = useI18n();

  const stats = [
    { label: t("stats.totalWords"), value: totalWords.toLocaleString(), icon: Hash, color: "bg-brand-50 text-brand-600" },
    { label: t("stats.uniqueLemmas"), value: uniqueLemmas.toLocaleString(), icon: Bookmark, color: "bg-emerald-50 text-emerald-600" },
    { label: t("stats.showing"), value: filteredCount.toLocaleString(), icon: Filter, color: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="bg-white border border-warm-200 rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-warm-400 uppercase tracking-wide mb-0.5">{s.label}</div>
              <div className="text-lg font-bold text-ink tabular-nums">{s.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
