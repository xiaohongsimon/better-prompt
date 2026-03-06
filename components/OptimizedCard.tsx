'use client';

import { motion } from 'framer-motion';
import { ChevronDown, Copy } from 'lucide-react';
import type { JudgeResult, OptimizedResult } from '@/types';

interface OptimizedCardProps {
  optimized: OptimizedResult;
  result?: JudgeResult;
  index: number;
}

export function OptimizedCard({ optimized, result, index }: OptimizedCardProps) {
  const handleCopy = async () => {
    if (!optimized.optimizedPrompt) return;
    await navigator.clipboard.writeText(optimized.optimizedPrompt);
  };

  const previewText = optimized.optimizedPrompt || optimized.error || '等待返回';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex h-[360px] flex-col overflow-hidden rounded-[30px] border shadow-[0_22px_70px_rgba(24,36,58,0.07)] ${
        result?.rank === 1
          ? 'border-[rgba(191,140,52,0.28)] bg-[linear-gradient(180deg,rgba(255,249,238,0.96),rgba(255,255,255,0.96))]'
          : 'border-[rgba(18,28,45,0.08)] bg-[rgba(255,255,255,0.9)]'
      }`}
    >
      <div className="border-b border-black/5 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {result?.rank ? (
                <span className="rounded-full bg-[var(--ink-strong)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                  #{result.rank}
                </span>
              ) : (
                <span className="rounded-full bg-[rgba(18,28,45,0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                  Live
                </span>
              )}
              <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                {optimized.provider}
              </span>
            </div>
            <h3 className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
              {optimized.modelName}
            </h3>
          </div>

          <button
            onClick={handleCopy}
            disabled={!optimized.optimizedPrompt}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(18,28,45,0.08)] bg-white/76 px-3 py-1.5 text-xs text-[var(--ink-strong)] disabled:opacity-40"
          >
            <Copy className="size-3.5" />
            复制
          </button>
        </div>
      </div>

      <div className="flex-1 px-5 py-4">
        <p className="line-clamp-[11] whitespace-pre-wrap text-[14px] leading-7 text-[var(--ink-strong)]">
          {previewText}
        </p>
      </div>

      <div className="px-5 pb-5">
        <details className="group rounded-[22px] border border-[rgba(18,28,45,0.08)] bg-[rgba(247,242,235,0.7)] px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-[var(--ink-strong)]">
            查看细节
            <ChevronDown className="size-4 transition group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--ink-soft)]">
            <div>{result?.verdict || optimized.strategySummary || '暂无'}</div>
            {result?.score ? <div>评分：{result.score} / 100</div> : null}
            {result?.strengths?.length ? <div>优势：{result.strengths.join('；')}</div> : null}
            {result?.improvementFocus?.length ? <div>改进：{result.improvementFocus.join('；')}</div> : null}
          </div>
        </details>
      </div>
    </motion.article>
  );
}
