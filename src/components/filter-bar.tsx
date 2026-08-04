"use client";

import type { FilterState, StopwordsLevel } from "@/types";
import { TAG_LABELS, TAG_COLORS } from "@/lib/utils";
import { EXAM_TAGS } from "@/types";
import { useI18n } from "@/lib/i18n";

type Props = {
  filters: FilterState;
  onChange: (f: FilterState) => void;
};

export function FilterBar({ filters, onChange }: Props) {
  const { t } = useI18n();

  const STOPWORDS_OPTIONS: { value: StopwordsLevel; label: string }[] = [
    { value: "none", label: t("filters.none") },
    { value: "basic", label: t("filters.basic") },
    { value: "strong", label: t("filters.strong") },
  ];

  const toggleTag = (tag: string) => {
    const next = filters.activeTags.includes(tag)
      ? filters.activeTags.filter((t) => t !== tag)
      : [...filters.activeTags, tag];
    onChange({ ...filters, activeTags: next });
  };

  return (
    <div className="sticky top-0 z-10 bg-warm-50/95 backdrop-blur-sm border-b border-warm-200 py-3 flex flex-wrap items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* stopwords dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-warm-500 uppercase tracking-wide">
          {t("filters.stopwords")}
        </label>
        <select
          value={filters.stopwordsLevel}
          onChange={(e) =>
            onChange({ ...filters, stopwordsLevel: e.target.value as StopwordsLevel })
          }
          className="text-sm border border-warm-300 rounded-md px-2.5 py-1.5 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          {STOPWORDS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* separator */}
      <div className="hidden sm:block w-px h-6 bg-warm-300" />

      {/* exam tag toggles */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {EXAM_TAGS.map((tag) => {
          const active = filters.activeTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`
                text-xs font-medium px-2.5 py-1 rounded-full border transition-colors
                ${active
                  ? `${TAG_COLORS[tag]} border-current`
                  : "border-warm-200 text-warm-400 bg-white hover:border-warm-300 hover:text-warm-500"
                }
              `}
            >
              {TAG_LABELS[tag]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
