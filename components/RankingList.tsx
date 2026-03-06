'use client';

import { motion } from 'framer-motion';
import { OptimizedCard } from '@/components/OptimizedCard';
import type { JudgeResult, OptimizedResult } from '@/types';

interface RankingListProps {
  rankings: JudgeResult[];
  results: OptimizedResult[];
  judgeSummary: string;
  judgeStatus: 'idle' | 'running' | 'done';
}

export function RankingList({
  rankings,
  results,
  judgeSummary,
  judgeStatus,
}: RankingListProps) {
  const failedResults = results.filter((result) => result.error);
  const validResults = results.filter((result) => !result.error && result.optimizedPrompt);
  const rankingMap = new Map(rankings.map((ranking) => [ranking.model, ranking]));
  const displayResults =
    rankings.length > 0
      ? [...validResults].sort((a, b) => {
          const aRank = rankingMap.get(a.model)?.rank ?? 999;
          const bRank = rankingMap.get(b.model)?.rank ?? 999;
          return aRank - bRank;
        })
      : validResults;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="rounded-[32px] border border-[rgba(18,28,45,0.08)] bg-[rgba(255,255,255,0.84)] px-6 py-6 shadow-[0_30px_90px_rgba(24,36,58,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--accent-strong)]">
              Results
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--ink-strong)]">
              {judgeStatus === 'done' ? '裁判已完成排序' : judgeStatus === 'running' ? '裁判正在评分' : '候选结果已开始返回'}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">
              {judgeStatus === 'done'
                ? judgeSummary
                : judgeStatus === 'running'
                  ? '四个候选都已返回，裁判正在生成分数和最终顺序。你现在已经可以先看各模型结果。'
                  : '结果按返回先后依次落卡片，不等待最慢模型。'}
            </p>
          </div>
          <div className="rounded-full border border-[rgba(18,28,45,0.08)] bg-[rgba(247,242,235,0.85)] px-4 py-2 text-sm text-[var(--ink-soft)]">
            {validResults.length} / 4 已返回
          </div>
        </div>
      </div>

      {displayResults.map((optimized, index) => (
        <OptimizedCard
          key={optimized.model}
          optimized={optimized}
          result={rankingMap.get(optimized.model)}
          index={index}
        />
      ))}

      {failedResults.length > 0 && (
        <div className="rounded-[30px] border border-[rgba(180,58,38,0.12)] bg-[rgba(255,241,237,0.9)] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[rgb(132,39,27)]">
            Failed Models
          </h3>
          <div className="mt-3 space-y-2 text-sm leading-6 text-[rgb(132,39,27)]">
            {failedResults.map((result) => (
              <div
                key={result.model}
                className="rounded-2xl border border-[rgba(180,58,38,0.1)] bg-white/72 px-4 py-3"
              >
                <span className="font-medium">{result.modelName}</span>
                <span>：{result.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}
