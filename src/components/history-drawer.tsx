"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Trash2, FileText, Clock } from "lucide-react";
import type { AnalysisRecord } from "@/types";
import { loadRecords, deleteRecord } from "@/lib/storage";
import { useI18n } from "@/lib/i18n";

type Props = {
  open: boolean;
  onClose: () => void;
  onLoad: (record: AnalysisRecord) => void;
};

export function HistoryDrawer({ open, onClose, onLoad }: Props) {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const { t, locale } = useI18n();

  useEffect(() => {
    if (open) setRecords(loadRecords());
  }, [open]);

  const handleDelete = useCallback((id: string) => {
    deleteRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  if (!open) return null;

  const dateLocale = locale === "zh" ? "zh-CN" : "en-US";

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white border-l border-warm-200 z-50 flex flex-col shadow-xl animate-[slideIn_200ms_ease-out]">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-warm-200">
          <h2 className="text-base font-semibold text-ink">{t("history.title")}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-warm-100 transition-colors"
            aria-label={t("history.close")}
          >
            <X className="w-4 h-4 text-warm-500" />
          </button>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-warm-400 gap-2">
              <FileText className="w-10 h-10" />
              <p className="text-sm">{t("history.empty")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-warm-100">
              {records.map((r) => (
                <li
                  key={r.id}
                  className="px-5 py-3 hover:bg-warm-50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => onLoad(r)}
                      className="text-left flex-1 min-w-0"
                    >
                      <p className="text-sm font-medium text-ink truncate">
                        {r.fileName}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-warm-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(r.createdAt).toLocaleDateString(dateLocale)}
                        </span>
                        <span>{r.totalWords.toLocaleString()} {t("history.words")}</span>
                      </div>
                    </button>

                    {/* delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(r.id);
                      }}
                      className="p-1 rounded hover:bg-red-50 text-warm-400 hover:text-red-500 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label={t("history.delete")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
