import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Rows3 } from "lucide-react";
import { getArticlesByLang, type ArticleLang } from "@/lib/articles";
import { ArticleHeader } from "@/components/article-header";

export const metadata: Metadata = {
  title: "文章 · 词频工坊",
  description:
    "英文小说阅读与词汇学习文章:词汇量覆盖率解析、原版书选书指南、词频背单词法。每篇附原始 Markdown,方便阅读与转载。",
};

export default async function ArticlesIndex({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: ArticleLang = sp.lang === "en" ? "en" : "zh";
  const articles = getArticlesByLang(lang);
  const L =
    lang === "zh"
      ? {
          title: "文章",
          sub: "关于英文小说阅读与词汇学习的方法与数据",
          read: "阅读全文",
          raw: "Markdown",
          tag: "阅读",
        }
      : {
          title: "Articles",
          sub: "Essays on reading English novels and learning vocabulary",
          read: "Read",
          raw: "Markdown",
          tag: "Reading",
        };

  return (
    <div className="min-h-screen flex flex-col">
      <ArticleHeader lang={lang} />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-serif font-bold text-ink">{L.title}</h1>
        <p className="text-sm text-warm-500 mt-1">{L.sub}</p>

        <div className="mt-8 space-y-4">
          {articles.map((a) => (
            <article
              key={a.slug}
              className="rounded-xl border border-warm-200/70 bg-white/70 p-5 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 text-[11px] font-medium text-brand-600 mb-2">
                <span>{L.tag}</span>
                {a.category && <span className="text-warm-400">· {a.category}</span>}
              </div>
              <Link href={`/articles/${a.slug}`} className="block">
                <h2 className="font-serif font-bold text-ink hover:text-brand-700 leading-snug">
                  {a.title}
                </h2>
              </Link>
              {a.description && (
                <p className="text-sm text-warm-600 mt-2 leading-relaxed">
                  {a.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-4">
                <Link
                  href={`/articles/${a.slug}`}
                  className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {L.read}
                </Link>
                <Link
                  href={`/articles/${a.slug}/raw`}
                  className="flex items-center gap-1.5 text-xs font-medium text-warm-500 hover:text-warm-700"
                >
                  <Rows3 className="w-3.5 h-3.5" />
                  {L.raw}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
