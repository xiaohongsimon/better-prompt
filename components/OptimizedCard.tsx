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

  const previewText =
    optimized.status === 'pending'
      ? '正在生成中，结果会在该模型完成后自动出现。'
      : optimized.optimizedPrompt || optimized.error || '等待返回';
  const statusLabel =
    optimized.status === 'pending'
      ? 'Running'
      : optimized.status === 'error'
        ? 'Failed'
        : result?.rank
          ? `#${result.rank}`
          : 'Ready';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex h-[360px] flex-col overflow-hidden rounded-[30px] border shadow-[0_22px_70px_rgba(24,36,58,0.07)] ${
        result?.rank === 1
          ? 'border-[rgba(208,138,77,0.28)] bg-[linear-gradient(180deg,rgba(31,26,22,0.96),rgba(19,22,28,0.96))]'
          : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]'
      }`}
    >
      <div className="border-b border-black/5 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  optimized.status === 'pending'
                    ? 'bg-[rgba(18,28,45,0.08)] text-[var(--ink-soft)]'
                    : optimized.status === 'error'
                      ? 'bg-[rgba(180,58,38,0.12)] text-[rgb(132,39,27)]'
                      : 'bg-[var(--ink-strong)] text-white'
                }`}
              >
                {statusLabel}
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                {optimized.provider}
              </span>
              {optimized.latencyMs ? (
                <span className="text-[11px] text-[var(--ink-soft)]">{optimized.latencyMs} ms</span>
              ) : null}
            </div>
            <h3 className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
              {optimized.modelName}
            </h3>
          </div>

          <button
            onClick={handleCopy}
            disabled={!optimized.optimizedPrompt || optimized.status === 'pending'}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs text-[var(--ink-strong)] disabled:opacity-40"
          >
            <Copy className="size-3.5" />
            复制
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="whitespace-pre-wrap text-[14px] leading-7 text-[var(--ink-strong)]">
          {previewText}
        </p>
      </div>

      <div className="px-5 pb-5">
        <details
          className="group rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
          open={false}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-[var(--ink-strong)]">
            查看细节
            <ChevronDown className="size-4 transition group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--ink-soft)]">
            <div>{result?.verdict || optimized.strategySummary || '暂无'}</div>
            {result?.score ? <div>评分：{result.score} / 100</div> : null}
            {result?.strengths?.length ? <div>优势：{result.strengths.join('；')}</div> : null}
            {result?.improvementFocus?.length ? <div>改进：{result.improvementFocus.join('；')}</div> : null}
            {optimized.keyUpgrades.length > 0 ? <div>升级点：{optimized.keyUpgrades.join('；')}</div> : null}
          </div>
        </details>
      </div>
    </motion.article>
  );
}
