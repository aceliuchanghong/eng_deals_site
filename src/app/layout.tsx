import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LexiLoom — 英文小说词频分析器",
  description:
    "分析英文小说：获取词频、音标、翻译及考试词汇覆盖。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh"
      className={`${inter.variable} ${sourceSerif4.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-warm-50 text-ink font-sans">
        <I18nProvider defaultLocale="zh">
          <div className="animate-[fade-in-up_400ms_ease-out]">
            {children}
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
