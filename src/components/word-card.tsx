"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { WordResult } from "@/types";
import { cn, TAG_LABELS, TAG_COLORS, sanitizePhonetic } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type Props = {
  result: WordResult;
  rank: number;
  maxCount: number;
};

/**
 * Shared grid template for the word-list table. The sticky column header
 * (in WordList) and every row (here) use exactly the same tracks so all
 * columns align. Columns: rank · word · phonetic · frequency · count ·
 * tags · chevron. The frequency track is the only one that grows.
 */
export const WORD_GRID =
  "grid grid-cols-[2.5rem_minmax(6.5rem,10rem)_7.5rem_minmax(2rem,1fr)_3.25rem_auto_1.25rem] items-center gap-2";

export function WordCard({ result, rank, maxCount }: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const { lemma, totalCount, forms, examples, phonetic, translation, tags } = result;
  const barWidth = maxCount > 0 ? (totalCount / maxCount) * 100 : 0;
  const cleanPhonetic = sanitizePhonetic(phonetic);

  return (
    <div
      className={cn(
        WORD_GRID,
        "px-4 py-3 border-b border-warm-100 transition-colors animate-[word-enter_350ms_ease-out_both]",
        open ? "bg-brand-50/40" : rank % 2 === 0 ? "bg-white" : "bg-warm-50/50",
      )}
      style={{ animationDelay: `${(rank - 1) * 30}ms` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="contents text-left"
        aria-expanded={open}
      >
        {/* rank */}
        <span className="text-xs text-warm-400 tabular-nums text-right flex-shrink-0">
          {rank}
        </span>

        {/* lemma */}
        <span className="font-serif font-bold text-[15px] leading-snug text-ink truncate">
          {lemma}
        </span>

        {/* phonetic — .font-ipa so IPA glyphs render (JetBrains Mono has none) */}
        <span className="hidden sm:inline font-ipa text-xs text-warm-500 truncate">
          {cleanPhonetic ? `/${cleanPhonetic}/` : ""}
        </span>

        {/* frequency bar */}
        <div className="h-2.5 bg-brand-100/70 rounded-full overflow-hidden min-w-[30px] group/bar relative">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${barWidth}%`,
              background: "var(--brand-gradient)",
              boxShadow: "0 0 6px rgba(26, 63, 181, 0.25)",
            }}
          />
          {/* shimmer overlay on hover */}
          <div className="absolute inset-0 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                width: `${barWidth}%`,
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                animation: "shimmer 1.5s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* count */}
        <span className="text-sm font-medium text-ink tabular-nums text-right flex-shrink-0">
          {totalCount.toLocaleString()}
        </span>

        {/* exam tags */}
        <span className="flex gap-1 flex-shrink-0">
          {tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded-full border whitespace-nowrap",
                TAG_COLORS[tag],
              )}
            >
              {TAG_LABELS[tag]}
            </span>
          ))}
        </span>

        {/* chevron */}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-warm-400 flex-shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* expanded detail (spans all columns) */}
      <div
        className={cn(
          "col-span-full grid transition-all duration-200",
          open ? "grid-rows-[1fr] opacity-100 pt-1" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="pl-[5.5rem] py-3 space-y-3 border-t border-brand-100/50">
            {/* translation */}
            {translation && (
              <div>
                <span className="text-xs text-warm-400 block mb-1">{t("wordCard.trans")}</span>
                {translation.split(/\\n/).map((line, i) => (
                  <p key={i} className="text-sm text-ink leading-relaxed">
                    {line.trim()}
                  </p>
                ))}
              </div>
            )}

            {/* forms */}
            {forms.length > 0 && (
              <div>
                <span className="text-xs text-warm-400 block mb-1">{t("wordCard.forms")}</span>
                <div className="flex flex-wrap gap-2">
                  {forms.map((f) => (
                    <span
                      key={f.form}
                      className="text-xs bg-white text-warm-600 px-2 py-0.5 rounded border border-warm-200"
                    >
                      {f.form} <span className="text-warm-400">({f.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* examples */}
            {examples.length > 0 && (
              <div>
                <span className="text-xs text-warm-400 block mb-1">{t("wordCard.examples")}</span>
                <ul className="space-y-1.5">
                  {examples.slice(0, 3).map((ex, i) => (
                    <li
                      key={i}
                      className="text-xs text-warm-600 italic leading-relaxed border-l-2 border-warm-200 pl-3"
                    >
                      &#34;{ex.text}&#34;
                      {ex.chapter && (
                        <span className="not-italic text-warm-400 ml-1">— {ex.chapter}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
