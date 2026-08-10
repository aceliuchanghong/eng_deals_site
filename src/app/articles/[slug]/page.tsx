import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Rows3 } from "lucide-react";
import { marked } from "marked";
import { getArticle, getArticlesByLang } from "@/lib/articles";
import { SITE } from "@/lib/site";
import { ArticleHeader } from "@/components/article-header";
import { ArticleCopyButton } from "@/components/article-copy";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getArticlesByLang("zh")
    .concat(getArticlesByLang("en"))
    .map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} · 词频工坊`,
    description: article.description,
    keywords: article.keywords,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const html = marked.parse(article.body, { async: false }) as string;
  const rawUrl = `/articles/${slug}/raw`;
  const L =
    article.lang === "zh"
      ? {
          back: "返回文章列表",
          copy: "复制 Markdown",
          copied: "已复制",
          raw: "原始 Markdown",
        }
      : {
          back: "Back to articles",
          copy: "Copy Markdown",
          copied: "Copied",
          raw: "Raw Markdown",
        };

  const articleUrl = `${SITE.url}/articles/${article.slug}`;
  const { datePublished, dateModified } = article;
  // 结构化数据:让搜索引擎理解文章本体与页面层级
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    inLanguage: article.lang,
    mainEntityOfPage: articleUrl,
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: article.category || "文章",
        item: `${SITE.url}/articles`,
      },
      { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ArticleHeader lang={article.lang} />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href={`/articles?lang=${article.lang}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-500 hover:text-warm-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {L.back}
        </Link>

        {article.category && (
          <div className="mt-5 text-[11px] font-medium text-brand-600 uppercase tracking-wide">
            {article.category}
          </div>
        )}
        <h1 className="mt-1 text-2xl sm:text-[1.75rem] font-serif font-bold text-ink leading-tight">
          {article.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ArticleCopyButton
            url={rawUrl}
            label={L.copy}
            doneLabel={L.copied}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 border border-warm-200 rounded-md px-2.5 py-1.5 transition-colors"
          />
          <a
            href={rawUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-500 hover:text-warm-700 border border-warm-200 rounded-md px-2.5 py-1.5 transition-colors"
          >
            <Rows3 className="w-3.5 h-3.5" />
            {L.raw}
          </a>
        </div>

        <div
          className="mt-6 prose-article"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </div>
  );
}
