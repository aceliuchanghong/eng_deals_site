"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copies the raw markdown of an article (fetched from its `?lang`/raw route)
 * to the clipboard. Used on the article detail page so both humans and AI
 * assistants can grab the exact source text.
 */
export function ArticleCopyButton({
  url,
  label,
  doneLabel,
  className,
}: {
  url: string;
  label: string;
  doneLabel: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          const res = await fetch(url);
          const text = await res.text();
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // ignore clipboard failures; the raw route link below still works
        }
      }}
      className={className}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      <span>{copied ? doneLabel : label}</span>
    </button>
  );
}
