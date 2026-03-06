'use client';

import { motion } from 'framer-motion';
import { OptimizedCard } from '@/components/OptimizedCard';
import type { JudgeResult, OptimizedResult } from '@/types';

interface RankingListProps {
  rankings: JudgeResult[];
  results: OptimizedResult[];
  judgeSummary: string;
}

export function RankingList({ rankings, results, judgeSummary }: RankingListProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="rounded-[30px] border border-white/60 bg-white/78 p-6 shadow-[0_30px_80px_rgba(28,37,56,0.12)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
          Judge Summary
        </p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-[var(--ink-strong)]">候选提示词排名</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">
              {judgeSummary}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm text-[var(--ink-soft)]">
            排序依据：清晰度 / 完整性 / 可控性 / 专业度 / 可执行性
          </div>
        </div>
      </div>

      {rankings.map((ranking) => {
        const optimized = results.find((result) => result.model === ranking.model);
        if (!optimized || optimized.error) return null;

        return (
          <OptimizedCard
            key={ranking.model}
            result={ranking}
            optimized={optimized}
          />
        );
      })}
    </motion.section>
  );
}
