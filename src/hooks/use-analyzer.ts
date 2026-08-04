"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AnalysisPhase, WordResult, AnalysisRecord } from "@/types";
import { saveRecord } from "@/lib/storage";
import { useDictLookup } from "@/hooks/use-dict-lookup";
import { useI18n } from "@/lib/i18n";

// ponytail: cache lemma map in memory to avoid re-fetching on every analysis
let lemmaMapCache: Record<string, string> | null = null;

// Matches the worker's ResultMsg shape
interface WorkerAnalysisResult {
  lemmas: {
    lemma: string;
    totalCount: number;
    forms: { form: string; count: number }[];
    examples: { text: string; chapter?: string }[];
  }[];
  totalWords: number;
  uniqueLemmasBeforeFilter: number;
}

export function useAnalyzer() {
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<WordResult[] | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const cancelledRef = useRef(false);
  const { lookup } = useDictLookup();
  const { t } = useI18n();

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setPhase("idle");
  }, []);

  const start = useCallback(
    async (file: File) => {
      cancelledRef.current = false;
      setError(null);
      setResults(null);
      setPhase("reading");
      setProgress(0);

      try {
        // 1. Read file as text
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsText(file);
        });

        if (cancelledRef.current) return;

        // 2. Fetch lemma map (cached in memory after first load)
        if (!lemmaMapCache) {
          lemmaMapCache = await fetch("/lemma/lemma-map.json").then((r) => {
            if (!r.ok) throw new Error("Lemma map not found");
            return r.json() as Promise<Record<string, string>>;
          });
        }
        const lemmaMap = lemmaMapCache;

        if (cancelledRef.current) return;

        // 3. Spawn worker & process
        setPhase("analyzing");

        const workerOutput = await new Promise<WorkerAnalysisResult>(
          (resolve, reject) => {
            const worker = new Worker(
              new URL("../workers/analyzer.worker.ts", import.meta.url),
            );
            workerRef.current = worker;

            worker.onmessage = (e: MessageEvent) => {
              const msg = e.data;
              if (msg?.type === "progress") {
                setProgress(msg.percent as number);
              } else if (msg?.type === "result") {
                resolve(msg as WorkerAnalysisResult);
              } else if (msg?.type === "error") {
                reject(new Error(msg.message as string));
              }
            };

            worker.onerror = (e) => {
              reject(new Error(e.message || "Worker error"));
            };

            worker.postMessage({
              type: "analyze",
              text,
              stopwords: [], // ponytail: stopwords applied client-side after analysis
              lemmaMap,
            });
          },
        );

        // Clean up worker reference after it finishes
        workerRef.current = null;

        if (cancelledRef.current) return;

        if (workerOutput.totalWords === 0) {
          setError(t("error.emptyFile"));
          setPhase("error");
          return;
        }

        // 4. Dict lookup (fetches manifest, shards, merges)
        setPhase("loading-dicts");
        setProgress(90);

        let enriched = await lookup(workerOutput.lemmas);

        if (cancelledRef.current) return;

        // H1: dict lookup failed — fall back to lemmas without enrichment
        if (enriched.length === 0 && workerOutput.lemmas.length > 0) {
          enriched = workerOutput.lemmas.map((l) => ({
            lemma: l.lemma,
            totalCount: l.totalCount,
            forms: l.forms,
            examples: l.examples,
            phonetic: null,
            translation: null,
            tags: [],
          }));
          setError(t("error.dictUnavailable"));
        } else {
          setError(null);
        }

        // 5. Save to localStorage
        setPhase("merging");
        setProgress(95);

        const record: AnalysisRecord = {
          id: crypto.randomUUID(),
          fileName: file.name,
          fileSize: file.size,
          createdAt: new Date().toISOString(),
          totalWords: workerOutput.totalWords,
          results: enriched,
          filters: {
            stopwordsLevel: "none",
            activeTags: [],
          },
        };

        saveRecord(record);

        setResults(enriched);
        setPhase("done");
        setProgress(100);
      } catch (err) {
        if (!cancelledRef.current) {
          setError(err instanceof Error ? err.message : String(err));
          setPhase("error");
        }
      }
    },
    [lookup, t],
  );

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  return { phase, setPhase, progress, error, results, setResults, start, cancel };
}
