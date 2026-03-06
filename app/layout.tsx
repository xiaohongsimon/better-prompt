import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BetterPrompt - 多模型提示词优化工具",
  description: "输入你的提示词，让多个 AI 模型为你优化，并由 GLM-5 评分排序",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}