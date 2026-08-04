"use client";

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

export function UploadZone({ onFile, disabled }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const validate = useCallback(
    (file: File): string | null => {
      if (!file.name.toLowerCase().endsWith(".txt")) {
        return t("upload.error.txtOnly");
      }
      if (file.size > MAX_SIZE) {
        return t("upload.error.tooLarge");
      }
      return null;
    },
    [t],
  );

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      onFile(file);
    },
    [validate, onFile],
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile],
  );

  const onDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      if (!disabled) setDragOver(true);
    },
    [disabled],
  );

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [],
  );

  return (
    <div className="w-full">
      {/* decorative gradient top bar */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
        className={`
          relative flex flex-col items-center justify-center gap-4 rounded-2xl h-[260px]
          cursor-pointer transition-all duration-200 select-none
          border border-dashed
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2
          ${dragOver
            ? "border-brand-400 bg-brand-50/50 scale-[1.01] shadow-lg"
            : "border-warm-200 bg-warm-50/50 hover:border-warm-400 hover:bg-warm-100/50"
          }
          ${disabled ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        {/* gradient top accent */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${
            dragOver
              ? "bg-brand-gradient"
              : "bg-warm-200"
          }`}
        />

        {/* icon container */}
        <div
          className={`w-[60px] h-[60px] rounded-2xl flex items-center justify-center transition-all duration-300 ${
            dragOver
              ? "bg-brand-100 text-brand-600 scale-110"
              : "bg-warm-100 text-warm-400 upload-icon-ring"
          }`}
        >
          {dragOver ? (
            <Upload className="w-7 h-7" />
          ) : (
            <FileText className="w-7 h-7" />
          )}
        </div>

        {/* text */}
        <div className="text-center">
          <p className="text-lg font-serif font-semibold text-ink">
            {t("upload.drop")}
          </p>
          <p className="text-sm text-warm-500 mt-1">
            {t("upload.hint")}
          </p>
          <p className="text-xs text-warm-400 mt-0.5">
            {t("upload.browse")}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".txt"
          onChange={onInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
