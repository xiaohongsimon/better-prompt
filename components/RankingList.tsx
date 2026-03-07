'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Expand, Minimize2 } from 'lucide-react';
import { OptimizedCard } from '@/components/OptimizedCard';
import type { JudgeResult, OptimizedResult } from '@/types';

interface RankingListProps {
  rankings: JudgeResult[];
  results: OptimizedResult[];
  judgeSummary: string;
  judgeStatus: 'idle' | 'running' | 'done';
  judgeSeconds: number;
  synthesizedBestPrompt: string;
  synthesisRationale: string;
  appliedAdvantages: string[];
  nowMs: number;
}

export function RankingList({
  rankings,
  results,
  judgeSummary,
  judgeStatus,
  judgeSeconds,
  synthesizedBestPrompt,
  synthesisRationale,
  appliedAdvantages,
  nowMs,
}: RankingListProps) {
  const [expanded, setExpanded] = useState(false);
  const rankingMap = new Map(rankings.map((ranking) => [ranking.model, ranking]));

  const handleCopySynthesis = async () => {
    if (!synthesizedBestPrompt) return;
    await navigator.clipboard.writeText(synthesizedBestPrompt);
  };

  return (
    <div className="space-y-6">
      {judgeStatus !== 'idle' ? (
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[30px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(208,138,77,0.05))] px-6 py-6 shadow-[0_28px_90px_rgba(0,0,0,0.24)] ${
            expanded ? 'min-h-[75vh]' : ''
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-4xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-strong)]">
                Judge / Kimi 2.5
              </p>
              <h3 className="mt-2 text-[32px] font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                {judgeStatus === 'done' ? '综合最佳版本' : '综合最佳版本正在生成'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                {judgeStatus === 'done'
                  ? judgeSummary
                  : '四路候选已收齐，Kimi 正在融合最优结构、约束和输出格式。'}
              </p>
              {judgeStatus === 'running' ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(214,185,139,0.18)] bg-[rgba(214,185,139,0.08)] px-3 py-2 text-sm text-[var(--accent-strong)]">
                  <span className="size-2 rounded-full bg-[var(--accent)] animate-pulse" />
                  正在定稿 · {formatSeconds(judgeSeconds)}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[var(--ink-strong)]"
            >
              {expanded ? <Minimize2 className="size-4" /> : <Expand className="size-4" />}
              {expanded ? '还原' : '放大'}
            </button>
          </div>

          <div className="mt-3">
            <button
              onClick={handleCopySynthesis}
              disabled={!synthesizedBestPrompt}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Copy className="size-4" />
              复制综合稿
            </button>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] bg-[rgba(255,255,255,0.04)] px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                Synthesized Prompt
              </p>
              <div className={`mt-3 overflow-y-auto pr-1 ${expanded ? 'max-h-[48vh]' : 'max-h-[320px]'}`}>
                <p className="whitespace-pre-wrap text-[15px] leading-8 text-[var(--ink-strong)]">
                  {synthesizedBestPrompt || '正在整合四个候选的优点并实时生成综合稿…'}
                </p>
                {judgeStatus === 'running' && !synthesizedBestPrompt ? (
                  <div className="mt-4 space-y-3">
                    <div className="h-4 w-[72%] rounded-full bg-[rgba(255,255,255,0.08)] animate-pulse" />
                    <div className="h-4 w-[84%] rounded-full bg-[rgba(255,255,255,0.06)] animate-pulse" />
                    <div className="h-4 w-[66%] rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse" />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <details className="group rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4" open={judgeStatus === 'done'}>
                <summary className="cursor-pointer list-none text-sm font-medium text-[var(--ink-strong)]">
                  排名与解释
                </summary>
                <div className={`mt-4 space-y-3 overflow-y-auto pr-1 text-sm leading-6 text-[var(--ink-soft)] ${expanded ? 'max-h-[30vh]' : 'max-h-[220px]'}`}>
                  {rankings.length > 0 ? (
                    rankings.map((ranking) => (
                      <div
                        key={ranking.model}
                        className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
                      >
                        <span className="font-medium text-[var(--ink-strong)]">#{ranking.rank} {ranking.modelName}</span>
                        <span> · {ranking.score} 分 · {ranking.verdict}</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                      裁判尚未返回。
                    </div>
                  )}
                </div>
              </details>

              <details className="group rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-[var(--ink-strong)]">
                  为什么这样融合
                </summary>
                <div className={`mt-4 space-y-3 overflow-y-auto pr-1 text-sm leading-6 text-[var(--ink-soft)] ${expanded ? 'max-h-[30vh]' : 'max-h-[220px]'}`}>
                  <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                    {synthesisRationale || '裁判完成后会说明融合逻辑。'}
                  </div>
                  {appliedAdvantages.length > 0 ? (
                    <div className="grid gap-2">
                      {appliedAdvantages.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </details>
            </div>
          </div>
        </motion.section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {results.length > 0 ? results.map((optimized, index) => (
          <OptimizedCard
            key={optimized.model}
            optimized={optimized}
            result={rankingMap.get(optimized.model)}
            index={index}
            nowMs={nowMs}
          />
        )) : (
          <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-5 py-8 text-sm leading-7 text-[var(--ink-soft)] xl:col-span-2">
            正在等待首个模型完成，结果会按返回顺序插入这里。
          </div>
        )}
      </div>
    </div>
  );
}

function formatSeconds(value: number) {
  return `${(value * 0.7).toFixed(1)} 秒`;
}
