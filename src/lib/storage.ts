import type { AnalysisRecord } from "@/types";

const STORAGE_KEY = "eng-deals-analyses";
const MAX_RECORDS = 20;

function readRaw(): AnalysisRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as AnalysisRecord[];
  } catch {
    return [];
  }
}

function writeRaw(records: AnalysisRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// ── Public API ───────────────────────────────────────────────────

export function loadRecords(): AnalysisRecord[] {
  return readRaw();
}

export function loadRecord(id: string): AnalysisRecord | null {
  return readRaw().find((r) => r.id === id) ?? null;
}

export function saveRecord(record: AnalysisRecord): void {
  try {
    const records = readRaw();
    // Remove any existing record with the same id, then prepend
    const filtered = records.filter((r) => r.id !== record.id);
    filtered.unshift(record);
    const trimmed = filtered.slice(0, MAX_RECORDS);
    writeRaw(trimmed);
  } catch (err) {
    if (
      err instanceof DOMException &&
      err.name === "QuotaExceededError"
    ) {
      // Quota hit: aggressively trim, keep the new record + a few recent ones
      const records = readRaw();
      const recent = records.slice(0, Math.floor(MAX_RECORDS / 4));
      recent.unshift(record);
      try {
        writeRaw(recent);
      } catch {
        console.error("localStorage quota exceeded, unable to save record");
      }
    } else {
      console.error("Failed to save record:", err);
    }
  }
}

export function deleteRecord(id: string): void {
  const records = readRaw().filter((r) => r.id !== id);
  writeRaw(records);
}
