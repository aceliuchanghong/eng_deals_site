"use client";

import type { FilterState } from "@/types";
import { TAG_LABELS, TAG_COLORS, UNTAGGED } from "@/lib/utils";
import { EXAM_TAGS } from "@/types";
import { useI18n } from "@/lib/i18n";

type Props = {
  filters: FilterState;
  onChange: (f: FilterState) => void;
};

export function FilterBar({ filters, onChange }: Props) {
  const { t } = useI18n();

  const toggleTag = (tag: string) => {
    const next = filters.activeTags.includes(tag)
      ? filters.activeTags.filter((t) => t !== tag)
      : [...filters.activeTags, tag];
    onChange({ ...filters, activeTags: next });
  };

  const untaggedActive = filters.activeTags.includes(UNTAGGED);

  return (
    <div className="sticky top-0 z-10 bg-warm-50/95 backdrop-blur-sm border-b border-warm-200 py-2.5 space-y-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-[11px] text-warm-400 px-0.5">{t("filters.hint")}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* 无标签 — web-only pseudo-tag: shows words with no exam tag */}
        <button
          type="button"
          onClick={() => toggleTag(UNTAGGED)}
          className={`
            text-xs font-medium px-2.5 py-1 rounded-full border transition-colors
            ${
              untaggedActive
                ? "bg-warm-700 text-white border-warm-700"
                : "border-dashed border-warm-300 text-warm-500 bg-white hover:border-warm-400 hover:text-warm-600"
            }
          `}
        >
          {t("filters.untagged")}
        </button>
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
