import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BetterPrompt Studio',
  description:
    '并行调用 Qwen、GLM、Kimi、MiniMax 优化提示词，再由裁判模型打分排序并输出专业点评。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
