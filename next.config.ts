import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 关闭左下角 Next.js 开发模式 "N" 指示器(仅影响 dev,不影响生产构建/错误提示)
  devIndicators: false,
  // /articles 等动态路由在 serverless 上运行时要用 fs 读取 SEO文章/,
  // 通过输出追踪把该目录打进函数包,否则构建期之外读不到会得到空列表。
  outputFileTracingIncludes: {
    "/*": ["./SEO文章/**/*"],
  },
};

export default nextConfig;
