import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE } from "@/lib/site";

export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 字体在构建期一次性读取,用于中文品牌名
const cjkFont = await readFile(
  join(process.cwd(), "public/fonts/SourceHanSerifCN-SemiBold.ttf"),
);

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #1a3fb5, #2559de)",
          fontFamily: "'Source Han Serif CN', 'noto-sans', sans-serif",
          color: "#ffffff",
        }}
      >
        {/* 品牌名 */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            词
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
              {SITE.name}
            </div>
          </div>
        </div>

        {/* 底部标题区 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.3 }}>
            英文小说词频分析器
          </div>
          <div
            style={{
              fontSize: 26,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.85)",
              maxWidth: 900,
            }}
          >
            上传英文小说,分析词频、音标、翻译及考试词汇覆盖,一键导出精美 PDF 单词本。
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Source Han Serif CN",
          data: cjkFont,
          style: "normal",
          weight: 600,
        },
      ],
    },
  );
}
