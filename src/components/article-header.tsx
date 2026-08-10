import Link from "next/link";
import { BookOpen, Newspaper } from "lucide-react";
import type { ArticleLang } from "@/lib/articles";

export function ArticleHeader({ lang }: { lang: ArticleLang }) {
  const brand = lang === "zh" ? "词频工坊" : "WordLoom";
  const navLabel = lang === "zh" ? "文章" : "Articles";
  const toggle = lang === "zh" ? "EN" : "中文";
  const langHref = lang === "zh" ? "/articles?lang=en" : "/articles";
  const navHref = lang === "zh" ? "/articles" : "/articles?lang=en";
  return (
    <header className="sticky top-0 z-20 border-b border-warm-200/60 bg-white/80 backdrop-blur-md">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-70 transition-opacity"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--brand-gradient)" }}
          >
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold font-serif text-ink tracking-tight">
            {brand}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={navHref}
            className="flex items-center gap-1.5 text-[11px] font-medium text-warm-400 hover:text-ink transition-colors px-2 py-1 rounded-md hover:bg-warm-100"
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{navLabel}</span>
          </Link>
          <Link
            href={langHref}
            className="text-[11px] font-medium text-warm-400 hover:text-ink transition-colors px-2 py-1 rounded-md hover:bg-warm-100"
          >
            {toggle}
          </Link>
        </div>
      </div>
    </header>
  );
}
