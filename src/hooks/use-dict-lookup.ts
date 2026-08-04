import { useState, useCallback, useRef } from "react";
import type { WordResult } from "@/types";
import { lookupDictData } from "@/lib/dict-lookup";

type LemmaInput = {
  lemma: string;
  totalCount: number;
  forms: { form: string; count: number }[];
  examples: { text: string; chapter?: string }[];
};

export function useDictLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generationRef = useRef(0);

  const lookup = useCallback(
    async (lemmas: LemmaInput[]): Promise<WordResult[]> => {
      const gen = ++generationRef.current;
      setLoading(true);
      setError(null);

      try {
        const results = await lookupDictData(lemmas);
        // Discard stale results if another lookup started after this one
        if (generationRef.current !== gen) return [];
        return results;
      } catch (err) {
        if (generationRef.current !== gen) return [];
        const message =
          err instanceof Error ? err.message : String(err);
        setError(message);
        return [];
      } finally {
        if (generationRef.current === gen) setLoading(false);
      }
    },
    [],
  );

  return { lookup, loading, error };
}
