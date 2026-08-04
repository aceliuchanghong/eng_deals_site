"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// ── Types ──────────────────────────────────────────────────────────

export type Locale = "zh" | "en";

type TranslationDict = Record<string, Record<Locale, string>>;

// ── Dictionary ─────────────────────────────────────────────────────

const dict: TranslationDict = {
  // Header
  "header.subtitle": {
    zh: "英文小说词频分析器",
    en: "English Novel Word Analyzer",
  },
  "header.history": { zh: "历史", en: "History" },

  // Idle hero
  "hero.title": {
    zh: "编织你的小说数据",
    en: "Weave your novel into data",
  },
  "hero.subtitle": {
    zh: "分析英文小说，获取词频、音标、翻译及考试词汇覆盖",
    en: "Analyze English novels for word frequency, phonetics, translations, and exam-level vocabulary coverage.",
  },

  // Landing page
  "landing.demo": {
    zh: "试试示例文本",
    en: "Try with sample text",
  },
  "landing.demoLoading": {
    zh: "加载中...",
    en: "Loading...",
  },
  "landing.step1Title": {
    zh: "上传小说",
    en: "Upload Novel",
  },
  "landing.step1Desc": {
    zh: "拖放 .txt 英文小说文件",
    en: "Drag & drop your .txt English novel",
  },
  "landing.step2Title": {
    zh: "自动分析",
    en: "Auto Analysis",
  },
  "landing.step2Desc": {
    zh: "词频统计、词形还原、例句提取",
    en: "Frequency count, lemmatization, example extraction",
  },
  "landing.step3Title": {
    zh: "导出学习",
    en: "Export & Study",
  },
  "landing.step3Desc": {
    zh: "按考试等级筛选，导出精美 PDF",
    en: "Filter by exam level, export beautiful PDF",
  },

  // Footer
  // Search
  "search.placeholder": {
    zh: "搜索单词...",
    en: "Search for a word...",
  },

  "footer.tagline": {
    zh: "英文词频分析器",
    en: "English word frequency analyzer",
  },

  // Upload zone
  "upload.drop": {
    zh: "将英文小说拖放到此处",
    en: "Drop your English novel here",
  },
  "upload.hint": { zh: ".txt 文件，最大 50MB", en: ".txt files up to 50MB" },
  "upload.browse": { zh: "或点击浏览文件", en: "or click to browse your files" },
  "upload.error.txtOnly": {
    zh: "仅支持 .txt 文件",
    en: "Only .txt files are accepted.",
  },
  "upload.error.tooLarge": {
    zh: "文件不能超过 50MB",
    en: "File must be under 50MB.",
  },

  // Processing
  "processing.analyzing": {
    zh: "正在分析 {filename}",
    en: "Analyzing {filename}",
  },
  "processing.cancel": { zh: "取消", en: "Cancel" },

  // Phase labels
  "phase.waiting": { zh: "等待", en: "Waiting" },
  "phase.reading": { zh: "读取文件", en: "Reading file" },
  "phase.analyzing": { zh: "分析文本", en: "Analyzing text" },
  "phase.loadingDicts": { zh: "加载词典", en: "Loading dictionaries" },
  "phase.merging": { zh: "合并结果", en: "Merging results" },
  "phase.done": { zh: "完成", en: "Complete" },
  "phase.error": { zh: "错误", en: "Error" },

  // Phase tips
  "phase.tip.reading": {
    zh: "正在扫描文件...",
    en: "Scanning your file for word tokens...",
  },
  "phase.tip.analyzing": {
    zh: "正在统计单词并提取例句...",
    en: "Tokenizing and lemmatizing each word found...",
  },
  "phase.tip.loadingDicts": {
    zh: "正在查询词典...",
    en: "Fetching dictionary data for lookups...",
  },
  "phase.tip.merging": {
    zh: "正在整理结果...",
    en: "Combining frequency data with dictionary entries...",
  },

  // Stats
  "stats.totalWords": { zh: "总词数", en: "Total Words" },
  "stats.uniqueLemmas": { zh: "独立词元", en: "Unique Lemmas" },
  "stats.dictCoverage": { zh: "词典覆盖率", en: "Dict Coverage" },
  "stats.showing": { zh: "当前显示", en: "Showing" },

  // Filters
  "filters.stopwords": { zh: "停用词", en: "Stopwords" },
  "filters.none": { zh: "无", en: "None" },
  "filters.basic": { zh: "基础", en: "Basic" },
  "filters.strong": { zh: "强力", en: "Strong" },
  "filters.hint": {
    zh: "点击标签筛选考试等级（留空显示全部）",
    en: "Click to filter by exam level (show all when none selected)",
  },

  // Word list
  "wordList.empty": {
    zh: "没有匹配当前筛选条件的单词",
    en: "No words match the current filters.",
  },
  "wordList.emptyHint": {
    zh: "请尝试调整停用词级别或考试标签筛选",
    en: "Try adjusting your stopwords level or exam tag selection.",
  },
  "wordList.colRank": { zh: "#", en: "#" },
  "wordList.colWord": { zh: "单词", en: "Word" },
  "wordList.colFrequency": { zh: "频率", en: "Frequency" },
  "wordList.colCount": { zh: "次数", en: "Count" },
  "wordList.colTags": { zh: "标签", en: "Tags" },
  "wordList.scrollTop": { zh: "回到顶部", en: "Scroll to top" },

  // Word card
  "wordCard.trans": { zh: "翻译", en: "Trans." },
  "wordCard.forms": { zh: "词形变化", en: "Forms" },
  "wordCard.examples": { zh: "例句", en: "Examples" },

  // Export PDF
  "exportPdf.button": { zh: "导出 PDF", en: "Export PDF" },
  "exportPdf.generating": { zh: "正在生成 PDF...", en: "Generating PDF..." },
  "exportPdf.error": {
    zh: "PDF 生成失败，请重试或减少单词数量",
    en: "PDF generation failed. Try again or reduce the word count.",
  },

  // History drawer
  "history.title": { zh: "历史分析", en: "Past Analyses" },
  "history.empty": { zh: "暂无历史分析", en: "No past analyses" },
  "history.close": { zh: "关闭", en: "Close" },
  "history.delete": { zh: "删除", en: "Delete" },
  "history.words": { zh: "词", en: "words" },

  // Error states
  "error.default": { zh: "出了点问题", en: "Something went wrong." },
  "error.emptyFile": {
    zh: "文件中未找到英文单词",
    en: "No English words found in this file.",
  },
  "error.dictUnavailable": {
    zh: "词典数据不可用，结果不含音标和翻译",
    en: "Dictionary data unavailable — results shown without phonetics or translations.",
  },
  "error.startOver": { zh: "重新开始", en: "Start over" },

  // PDF template
  "pdf.title": {
    zh: "词频分析 — {filename}",
    en: "Word Frequency Analysis — {filename}",
  },
  "pdf.subtitle": {
    zh: "生成于 {date} | {totalWords} 词 | {uniqueLemmas} 个独立词元 | {coveragePercent}% 词典覆盖率",
    en: "Generated {date} | {totalWords} words | {uniqueLemmas} unique lemmas | {coveragePercent}% dict coverage",
  },
  "pdf.generatedOn": { zh: "生成于", en: "Generated" },
  "pdf.colWord": { zh: "单词", en: "Word" },
  "pdf.colPhonetic": { zh: "音标", en: "Phonetic" },
  "pdf.colTranslation": { zh: "翻译", en: "Translation" },
  "pdf.colTags": { zh: "标签", en: "Tags" },
  "pdf.colFreq": { zh: "频率", en: "Freq" },

  // Language toggle
  "lang.switchTo": { zh: "EN", en: "中文" },
};

// ── Context ────────────────────────────────────────────────────────

const LS_KEY = "lexiloom-locale";

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "zh";
  const stored = localStorage.getItem(LS_KEY);
  if (stored === "en" || stored === "zh") return stored;
  return "zh";
}

type I18nContextValue = {
  t: (key: string) => string;
  locale: Locale;
  setLocale: (l: Locale) => void;
};

const I18nContext = createContext<I18nContextValue>({
  t: (key) => key,
  locale: "zh",
  setLocale: () => {},
});

// ── Provider ───────────────────────────────────────────────────────

export function I18nProvider({
  children,
  defaultLocale = "zh",
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // ponytail: SSR-safe initial read; useEffect syncs localStorage on mount
    if (typeof window === "undefined") return defaultLocale;
    return readStoredLocale();
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, l);
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const entry = dict[key];
      if (!entry) return key; // fallback: key itself
      return entry[locale] ?? entry["zh"] ?? key;
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

// ── Standalone translate (for non-component contexts, e.g. PDF) ───

export function translate(key: string, locale: Locale): string {
  const entry = dict[key];
  if (!entry) return key;
  return entry[locale] ?? entry["zh"] ?? key;
}
