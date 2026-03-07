'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Copy, Expand, Minimize2 } from 'lucide-react';
import type { JudgeResult, OptimizedResult } from '@/types';

interface OptimizedCardProps {
  optimized: OptimizedResult;
  result?: JudgeResult;
  index: number;
  nowMs: number;
}

export function OptimizedCard({ optimized, result, index, nowMs }: OptimizedCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isWorking = optimized.status === 'pending' || optimized.status === 'streaming';

  const handleCopy = async () => {
    if (!optimized.optimizedPrompt) return;
    await navigator.clipboard.writeText(optimized.optimizedPrompt);
  };

  const previewText =
    optimized.status === 'pending'
      ? '已发起并行调用，正在等待首段返回。'
      : optimized.optimizedPrompt || optimized.error || '等待返回';
  const statusLabel =
    optimized.status === 'pending'
      ? 'Running'
      : optimized.status === 'streaming'
        ? 'Streaming'
      : optimized.status === 'error'
        ? 'Failed'
        : result?.rank
          ? `#${result.rank}`
          : 'Ready';

  const timerText =
    optimized.status === 'done'
      ? optimized.latencyMs
        ? formatSeconds(optimized.latencyMs / 1000)
        : null
      : optimized.startedAtMs
        ? formatSeconds((nowMs - optimized.startedAtMs) / 1000)
        : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: isWorking ? [0, -4, 0] : 0,
      }}
      transition={{
        delay: index * 0.05,
        y: {
          duration: 2.4 + index * 0.2,
          repeat: isWorking ? Number.POSITIVE_INFINITY : 0,
          ease: 'easeInOut',
        },
      }}
      className={`flex flex-col overflow-hidden rounded-[28px] border shadow-[0_22px_70px_rgba(24,36,58,0.07)] ${
        result?.rank === 1
          ? 'border-[rgba(208,138,77,0.28)] bg-[linear-gradient(180deg,rgba(31,26,22,0.96),rgba(19,22,28,0.96))]'
          : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]'
      } ${expanded ? 'min-h-[68vh]' : 'h-[360px]'}`}
    >
      <div
        className={`h-1 w-full ${
          optimized.status === 'streaming'
            ? 'bg-[linear-gradient(90deg,transparent,rgba(255,180,0,0.9),transparent)] animate-pulse'
            : optimized.status === 'done'
              ? 'bg-[linear-gradient(90deg,rgba(99,214,126,0.0),rgba(99,214,126,0.9),rgba(99,214,126,0.0))]'
              : 'bg-transparent'
        }`}
      />
      <div className="border-b border-white/5 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {optimized.completionRank ? (
                <span className="rounded-full bg-[rgba(214,185,139,0.18)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  Speed Top {optimized.completionRank}
                </span>
              ) : null}
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  optimized.status === 'pending'
                    ? 'bg-[rgba(80,116,255,0.18)] text-[rgb(174,198,255)]'
                    : optimized.status === 'streaming'
                      ? 'bg-[rgba(80,116,255,0.24)] text-[rgb(200,215,255)]'
                    : optimized.status === 'error'
                      ? 'bg-[rgba(180,58,38,0.2)] text-[rgb(244,171,157)]'
                      : 'bg-[rgba(214,185,139,0.18)] text-[var(--accent-strong)]'
                }`}
              >
                {statusLabel}
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                {optimized.provider}
              </span>
              {timerText ? (
                <span className="text-[11px] text-[var(--ink-soft)]">{timerText}</span>
              ) : null}
            </div>
            <h3 className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
              {optimized.modelName}
            </h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {optimized.status === 'streaming'
                ? '正在独立重写与收束结构'
                : optimized.status === 'done'
                  ? '候选已完成，可进入比较'
                  : '并行调用已发出，等待首段内容'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs text-[var(--ink-soft)]"
          >
            {expanded ? <Minimize2 className="size-3.5" /> : <Expand className="size-3.5" />}
            {expanded ? '还原' : '放大'}
          </button>
        </div>
        <div className="mt-3">
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

      <div className={`flex-1 overflow-y-auto px-5 py-4 ${expanded ? 'min-h-[42vh]' : ''}`}>
        {optimized.status === 'pending' ? (
          <div className="space-y-3">
            <div className="h-4 w-[68%] rounded-full bg-[rgba(255,255,255,0.08)]" />
            <div className="h-4 w-[86%] rounded-full bg-[rgba(255,255,255,0.06)]" />
            <div className="h-4 w-[72%] rounded-full bg-[rgba(255,255,255,0.06)]" />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="h-28 rounded-[20px] bg-[rgba(255,255,255,0.04)]" />
              <div className="h-28 rounded-[20px] bg-[rgba(255,255,255,0.04)]" />
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-[14px] leading-7 text-[var(--ink-strong)]">
            {previewText}
            {optimized.status === 'streaming' ? <span className="ml-1 inline-block h-5 w-2 animate-pulse rounded-sm bg-[var(--accent)] align-middle" /> : null}
          </p>
        )}
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

function formatSeconds(value: number) {
  return `${(Math.max(value, 0) * 0.7).toFixed(1)} 秒`;
}
