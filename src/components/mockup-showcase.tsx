"use client";

import { Search, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// ── Fake data so the two "screenshots" read like a real analysis ──
const ROWS = [
  { w: "opportunity",  p: "/ˌɒpəˈtjuːnəti/",  c: 96, tags: ["cet6"] },
  { w: "capacity",     p: "/kəˈpæsəti/",       c: 84, tags: ["cet6", "gre"] },
  { w: "immediately",  p: "/ɪˈmiːdiətli/",     c: 72, tags: ["cet4"] },
  { w: "experience",   p: "/ɪkˈspɪəriəns/",    c: 61, tags: ["cet4"] },
  { w: "significant",  p: "/sɪɡˈnɪfɪkənt/",    c: 55, tags: ["cet6", "toefl"] },
  { w: "phenomenon",   p: "/fəˈnɒmɪnən/",      c: 43, tags: ["cet6"] },
  { w: "circumstance", p: "/ˈsɜːkəmstæns/",    c: 34, tags: ["cet6", "ielts"] },
];

const TAG_PILL: Record<string, string> = {
  cet4:  "bg-brand-50 text-brand-700 border-brand-200",
  cet6:  "bg-indigo-50 text-indigo-700 border-indigo-200",
  toefl: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ielts: "bg-amber-50 text-amber-700 border-amber-200",
  gre:   "bg-rose-50 text-rose-700 border-rose-200",
};

const PDF_TAG_HEX: Record<string, { fg: string; bg: string }> = {
  cet4:  { fg: "#1565C0", bg: "#E3F2FD" },
  cet6:  { fg: "#3F51B5", bg: "#E8EAF6" },
  toefl: { fg: "#2E7D32", bg: "#E8F5E9" },
  ielts: { fg: "#8A6D00", bg: "#FFF8E1" },
  gre:   { fg: "#C62828", bg: "#FCE4EC" },
};

// Edge-fade (opacity gradient) so each panel dissolves into the page.
const FADE = {
  maskImage:
    "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 7%, rgba(0,0,0,1) 92%, rgba(0,0,0,0) 100%), linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0.15) 100%)",
  WebkitMaskImage:
    "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 7%, rgba(0,0,0,1) 92%, rgba(0,0,0,0) 100%), linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0.15) 100%)",
} as const;

/** Small "browser window" mock of the organized result view (left, in focus). */
function ResultMock() {
  const { t } = useI18n();
  const max = Math.max(...ROWS.map((r) => r.c));
  return (
    <div className="rounded-xl border border-warm-200 bg-white shadow-[0_24px_60px_-18px_rgba(26,24,23,0.45)] overflow-hidden font-sans">
      {/* fake window chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-warm-100 bg-warm-50/70">
        <span className="w-2 h-2 rounded-full bg-warm-300" />
        <span className="w-2 h-2 rounded-full bg-warm-300" />
        <span className="w-2 h-2 rounded-full bg-warm-300" />
        <span className="ml-2 text-[9px] text-warm-400 truncate">novel.txt · {t("brand.name")}</span>
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {/* stats */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { n: "123,456", l: t("stats.totalWords"), c: "bg-brand-50 text-brand-600" },
            { n: "8,034", l: t("stats.uniqueLemmas"), c: "bg-emerald-50 text-emerald-600" },
            { n: "42", l: t("stats.showing"), c: "bg-rose-50 text-rose-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border border-warm-200 px-2 py-1.5 flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center ${s.c}`} />
              <div className="leading-none">
                <div className="text-[8px] text-warm-400 truncate">{s.l}</div>
                <div className="text-[12px] font-bold text-ink tabular-nums">{s.n}</div>
              </div>
            </div>
          ))}
        </div>

        {/* filter chips */}
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[8px] text-warm-400 shrink-0">{t("filters.stopwords")} · {t("filters.strong")}</span>
          {["cet6", "cet4", "toefl", "ielts", "gre"].map((tag) => (
            <span
              key={tag}
              className={`text-[7px] font-medium px-1.5 py-0.5 rounded-full border whitespace-nowrap ${TAG_PILL[tag]}`}
            >
              {tag.toUpperCase()}
            </span>
          ))}
        </div>

        {/* search box */}
        <div className="flex items-center gap-1.5 rounded-lg border border-warm-200 px-2 py-1 text-[9px] text-warm-400">
          <Search className="w-2.5 h-2.5" />
          {t("search.placeholder")}
        </div>

        {/* word rows */}
        <div className="rounded-lg border border-warm-100 overflow-hidden">
          {ROWS.map((r, i) => (
            <div
              key={r.w}
              className={`grid grid-cols-[16px_minmax(0,1fr)_42px_34px_auto] items-center gap-1.5 px-2 py-1.5 ${
                i % 2 === 0 ? "bg-white" : "bg-warm-50/50"
              } border-b border-warm-50 last:border-b-0`}
            >
              <span className="text-[8px] text-warm-400 tabular-nums text-right">{i + 1}</span>
              <span className="font-serif font-bold text-[11px] text-ink leading-tight truncate">{r.w}</span>
              {/* frequency bar */}
              <div className="h-1.5 rounded-full bg-brand-100/70 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(r.c / max) * 100}%`, background: "var(--brand-gradient)" }}
                />
              </div>
              <span className="text-[9px] font-medium text-ink tabular-nums text-right">{r.c}</span>
              <span className="flex gap-0.5 justify-end">
                <span className={`text-[6px] font-medium px-1 py-px rounded-full border ${TAG_PILL[r.tags[0]]}`}>
                  {r.tags[0].toUpperCase()}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mock of an exported A4 cover page (right, background → depth of field). */
function PdfMock() {
  const { t } = useI18n();
  return (
    <div className="aspect-[3/4.2] rounded-sm bg-white shadow-[0_30px_60px_-16px_rgba(26,24,23,0.5)] flex flex-col items-center justify-center px-5 py-6 text-center font-sans relative overflow-hidden">
      {/* faint page shadow along left for a printed feel */}
      <div className="absolute left-0 top-0 h-full w-px bg-warm-100/60" />

      <div className="text-[17px] font-serif font-semibold text-ink tracking-[0.3em] uppercase">
        {t("brand.name")}
      </div>
      <div className="text-[6.5px] text-warm-400 tracking-[0.18em] uppercase mt-1.5 mb-3">
        {t("header.subtitle")}
      </div>
      <div className="w-1/4 h-px bg-ink/70 mb-4" />

      <div className="flex items-center gap-1 text-warm-400 mb-3">
        <FileText className="w-2.5 h-2.5" />
        <span className="text-[9px] font-semibold text-ink">novel.txt</span>
      </div>

      <div className="text-[7px] text-warm-400 mb-4">2026 年 8 月 10 日</div>

      <div className="grid grid-cols-2 gap-2 w-full px-2 mb-3">
        {[
          { n: "123,456", l: t("stats.totalWords") },
          { n: "8,034", l: t("stats.uniqueLemmas") },
        ].map((s) => (
          <div key={s.l} className="border border-warm-200 px-1.5 py-2">
            <div className="text-[14px] font-semibold text-ink tabular-nums">{s.n}</div>
            <div className="text-[6px] text-warm-400 tracking-[0.1em] uppercase mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-1 px-2">
        {["cet6", "toefl", "gre"].map((tag) => {
          const c = PDF_TAG_HEX[tag] ?? { fg: "#1565C0", bg: "#E3F2FD" };
          return (
            <span
              key={tag}
              className="text-[5.5px] font-semibold px-1.5 py-px rounded-[1px] uppercase"
              style={{ color: c.fg, backgroundColor: c.bg, border: `0.5px solid ${c.fg}` }}
            >
              {tag}
            </span>
          );
        })}
      </div>

      <div className="absolute bottom-2.5 inset-x-0 flex justify-between px-4 text-[5px] text-warm-300">
        <span className="uppercase">{t("brand.name")}</span>
        <span>1 / 128</span>
      </div>
    </div>
  );
}

/**
 * Two tilted "screenshots" — the organized result view (left, in focus) and the
 * exported PDF (right, pushed back): rotated on their side, with depth of field
 * (blur + scale) and opacity gradient fading each panel's edges into the page.
 */
export function MockupShowcase() {
  return (
    <div className="relative w-full max-w-2xl mx-auto select-none">
      {/* soft backdrop glow to anchor the depth */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(60% 60% at 50% 40%, rgba(74,128,237,0.16), rgba(255,255,255,0))" }}
      />

      {/* spacer keeps the layout height stable under absolutely-positioned panels */}
      <div className="h-[340px] sm:h-[380px]" />

      {/* ── PDF (far, right): blurred + desaturated + smaller → depth of field ── */}
      <div
        aria-hidden
        className="absolute right-0 top-[10%] w-[40%] h-[304px] sm:h-[342px] overflow-hidden will-change-transform"
        style={{
          transform: "rotate(7deg) rotateY(14deg) rotateX(4deg) translateY(4px)",
          filter: "blur(1.4px) saturate(.82) brightness(.97)",
          ...FADE,
        }}
      >
        <PdfMock />
      </div>

      {/* ── Result view (near, left): sharp + crisp + overlapping front ── */}
      <div
        aria-hidden
        className="absolute left-0 top-0 w-[62%] h-[340px] sm:h-[380px] overflow-hidden will-change-transform"
        style={{
          transform: "rotate(-5deg) rotateY(-11deg) rotateX(2deg)",
          filter: "drop-shadow(0 18px 30px rgba(26,24,23,0.22))",
          ...FADE,
        }}
      >
        <ResultMock />
      </div>
    </div>
  );
}
