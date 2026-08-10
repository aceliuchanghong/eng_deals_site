import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// ── Types ──────────────────────────────────────────────────────────

export type ArticleLang = "zh" | "en";

export type Article = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  lang: ArticleLang;
  category: string;
  body: string; // raw markdown body (frontmatter stripped)
  raw: string; // full file content (frontmatter + body)
};

// ── Loading ────────────────────────────────────────────────────────
// Single source of truth: the markdown files under SEO文章/{zh,en}.
// These are authored for SEO/publishing and served verbatim on the site.

const CONTENT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../SEO文章",
);

function parseFrontmatter(raw: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) {
    return { meta: {} as Record<string, string>, body: raw };
  }
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    let value = line.slice(sep + 1).trim();
    // strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) meta[key] = value;
  }
  const body = raw.slice(match[0].length).trimStart();
  return { meta, body };
}

let cache: Article[] | null = null;

export function getAllArticles(): Article[] {
  if (cache) return cache;
  cache = [];
  for (const lang of ["zh", "en"] as ArticleLang[]) {
    const dir = path.join(CONTENT_ROOT, lang);
    let files: string[] = [];
    try {
      files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    } catch {
      continue; // dir missing
    }
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { meta, body } = parseFrontmatter(raw);
      const slug = (meta.slug || file.replace(/\.md$/, "")).trim();
      if (!slug) continue;
      cache.push({
        slug,
        title: meta.title || slug,
        description: meta.description || "",
        keywords: (meta.keywords || "")
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        lang,
        category: meta.category || "",
        body,
        raw,
      });
    }
  }
  // stable: zh first, then en; alphabetical within
  cache.sort((a, b) => (a.lang === b.lang ? a.title.localeCompare(b.title) : a.lang === "zh" ? -1 : 1));
  return cache;
}

export function getArticlesByLang(lang: ArticleLang): Article[] {
  return getAllArticles().filter((a) => a.lang === lang);
}

export function getArticle(slug: string): Article | undefined {
  return getAllArticles().find((a) => a.slug === slug);
}
