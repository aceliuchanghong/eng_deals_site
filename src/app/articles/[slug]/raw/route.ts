import { NextResponse } from "next/server";
import { getArticle } from "@/lib/articles";

type Params = { params: Promise<{ slug: string }> };

// Serves the article's original markdown verbatim so AI assistants and
// other tools can fetch the exact source text (Content-Type: text/markdown).
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) {
    return new Response("Not found", { status: 404 });
  }
  return new NextResponse(article.raw, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `inline; filename="${slug}.md"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
