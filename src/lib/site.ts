/**
 * 站点级集中配置 —— 品牌名与正式域名都在这里,部署后只需改这一处。
 *
 * ⚠️ `url` 目前是占位 Vercel 域名(由仓库名推导)。Vercel 部署完成后,
 * 把它替换为真实项目域名(如 https://<project-name>.vercel.app 或自定义域名)。
 */
export const SITE = {
  /** 正式生产域名(部署后替换)。robots / sitemap / canonical / OG 图都依赖它 */
  url: "https://eng-deals-site.vercel.app",
  /** 品牌名(中文,更直白易理解) */
  name: "词频工坊",
  /** 浏览器标签 / 搜索结果标题 */
  title: "词频工坊 — 英文小说词频分析器",
  /** 页面描述,用于搜索引擎摘要与社交分享 */
  description:
    "上传英文小说,TXT 文本自动分析词频、音标、翻译及 CET/考试词汇覆盖,一键导出精美 PDF 单词本。",
};
