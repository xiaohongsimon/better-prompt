'use client';

import { motion } from 'framer-motion';
import { Copy } from 'lucide-react';
import { OptimizedCard } from '@/components/OptimizedCard';
import type { JudgeResult, OptimizedResult } from '@/types';

interface RankingListProps {
  rankings: JudgeResult[];
  results: OptimizedResult[];
  judgeSummary: string;
  judgeStatus: 'idle' | 'running' | 'done';
  synthesizedBestPrompt: string;
  synthesisRationale: string;
  appliedAdvantages: string[];
}

export function RankingList({
  rankings,
  results,
  judgeSummary,
  judgeStatus,
  synthesizedBestPrompt,
  synthesisRationale,
  appliedAdvantages,
}: RankingListProps) {
  const failedResults = results.filter((result) => result.error);
  const rankingMap = new Map(rankings.map((ranking) => [ranking.model, ranking]));

  const handleCopySynthesis = async () => {
    if (!synthesizedBestPrompt) return;
    await navigator.clipboard.writeText(synthesizedBestPrompt);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-4">
        {results.map((optimized, index) => (
          <OptimizedCard
            key={optimized.model}
            optimized={optimized}
            result={rankingMap.get(optimized.model)}
            index={index}
          />
        ))}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[34px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(208,138,77,0.05))] px-6 py-6 shadow-[0_28px_90px_rgba(0,0,0,0.24)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-strong)]">
              Judge / Kimi 2.5
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--ink-strong)]">
              {judgeStatus === 'done'
                ? '综合最佳版本'
                : judgeStatus === 'running'
                  ? '裁判正在综合四个结果'
                  : '等待四个结果全部返回'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              {judgeStatus === 'done'
                ? judgeSummary
                : judgeStatus === 'running'
                  ? '已开始评分与融合。你现在可以先浏览四个候选版本。'
                  : '裁判带会在四个候选都返回后展示排序、综合稿和解释。'}
            </p>
          </div>

          <button
            onClick={handleCopySynthesis}
            disabled={!synthesizedBestPrompt}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Copy className="size-4" />
            复制综合稿
          </button>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] bg-[rgba(255,255,255,0.04)] px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
              Synthesized Prompt
            </p>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-8 text-[var(--ink-strong)]">
              {synthesizedBestPrompt || '裁判完成后会在这里输出综合最佳版本。'}
            </p>
          </div>

          <div className="space-y-4">
            <details className="group rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4" open={judgeStatus === 'done'}>
              <summary className="cursor-pointer list-none text-sm font-medium text-[var(--ink-strong)]">
                排名与解释
              </summary>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--ink-soft)]">
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
              <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--ink-soft)]">
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

        {failedResults.length > 0 && (
          <div className="mt-5 rounded-[28px] border border-[rgba(180,58,38,0.18)] bg-[rgba(86,29,20,0.24)] px-5 py-4 text-sm leading-6 text-[rgb(241,187,173)]">
            {failedResults.map((result) => `${result.modelName}: ${result.error}`).join('；')}
          </div>
        )}
      </motion.section>
    </div>
  );
}
