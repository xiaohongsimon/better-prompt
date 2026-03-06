'use client';

import { motion } from 'framer-motion';
import { OptimizedCard } from './OptimizedCard';
import type { JudgeResult, OptimizedResult } from '@/types';

interface RankingListProps {
  rankings: JudgeResult[];
  results: OptimizedResult[];
}

export function RankingList({ rankings, results }: RankingListProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full space-y-6"
    >
      <h2 className="text-2xl font-bold text-center mb-6">优化结果排名</h2>
      {rankings.map((ranking) => {
        const result = results.find((r) => r.model === ranking.model);
        if (!result || result.error) return null;

        return (
          <OptimizedCard
            key={ranking.model}
            result={ranking}
            optimizedPrompt={result.optimizedPrompt}
            rank={ranking.rank}
          />
        );
      })}
    </motion.div>
  );
}