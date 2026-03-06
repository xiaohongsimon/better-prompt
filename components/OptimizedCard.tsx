'use client';

import { motion } from 'framer-motion';
import { ChevronDown, Copy } from 'lucide-react';
import type { JudgeResult, OptimizedResult } from '@/types';

interface OptimizedCardProps {
  optimized: OptimizedResult;
  result?: JudgeResult;
  index: number;
}

const RANK_LABELS: Record<number, string> = {
  1: 'Best Pick',
  2: 'Runner-up',
  3: 'Third',
};

export function OptimizedCard({ optimized, result, index }: OptimizedCardProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(optimized.optimizedPrompt);
  };

  const rank = result?.rank;
  const isWinner = rank === 1;

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`overflow-hidden rounded-[30px] border shadow-[0_24px_80px_rgba(24,36,58,0.08)] ${
        isWinner
          ? 'border-[rgba(191,141,55,0.34)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,245,222,0.98))]'
          : 'border-[rgba(18,28,45,0.08)] bg-[rgba(255,255,255,0.88)]'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-black/5 px-6 py-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {rank ? (
              <span className="rounded-full bg-[var(--ink-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                #{rank} {RANK_LABELS[rank] || 'Selected'}
              </span>
            ) : (
              <span className="rounded-full bg-[rgba(18,28,45,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                Arrived
              </span>
            )}
            <span className="rounded-full border border-[rgba(18,28,45,0.08)] bg-white/70 px-3 py-1 text-xs text-[var(--ink-soft)]">
              {optimized.provider}
            </span>
            {result?.score ? (
              <span className="rounded-full border border-[rgba(18,28,45,0.08)] bg-white/70 px-3 py-1 text-xs text-[var(--ink-soft)]">
                {result.score} / 100
              </span>
            ) : null}
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-[var(--ink-strong)]">{optimized.modelName}</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">
              {result?.verdict || optimized.strategySummary || '候选结果已返回，等待裁判。'}
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(18,28,45,0.08)] bg-white/76 px-4 py-2 text-sm text-[var(--ink-strong)] transition hover:border-[var(--accent)]"
        >
          <Copy className="size-4" />
          复制
        </button>
      </div>

      <div className="px-6 py-6">
        <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(247,242,235,0.92),rgba(255,255,255,0.92))] px-5 py-5">
          <p className="whitespace-pre-wrap text-[15px] leading-8 text-[var(--ink-strong)]">
            {optimized.optimizedPrompt}
          </p>
        </div>

        {(result || optimized.keyUpgrades.length > 0 || optimized.applicableScenarios.length > 0) && (
          <details className="group mt-5 rounded-[24px] border border-[rgba(18,28,45,0.08)] bg-white/66 px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-[var(--ink-strong)]">
              查看细节
              <ChevronDown className="size-4 transition group-open:rotate-180" />
            </summary>

            <div className="mt-4 grid gap-4 text-sm leading-6 text-[var(--ink-soft)] md:grid-cols-2">
              <DetailBlock
                title="优化策略"
                items={[optimized.strategySummary].filter(Boolean)}
              />
              {result ? (
                <DetailBlock
                  title="裁判点评"
                  items={[
                    `清晰度 ${result.dimensionScores.clarity}`,
                    `完整性 ${result.dimensionScores.completeness}`,
                    `可控性 ${result.dimensionScores.controllability}`,
                    `专业度 ${result.dimensionScores.professionality}`,
                    `可执行性 ${result.dimensionScores.executionLikelihood}`,
                  ]}
                />
              ) : (
                <DetailBlock title="状态" items={['裁判尚未开始，当前按返回顺序展示。']} />
              )}
              <DetailBlock title="关键升级点" items={optimized.keyUpgrades} />
              <DetailBlock
                title={result ? '改进建议' : '适用场景'}
                items={result?.improvementFocus || optimized.applicableScenarios}
              />
              {result ? <DetailBlock title="优势" items={result.strengths} /> : null}
              {result ? <DetailBlock title="不足" items={result.weaknesses} /> : null}
            </div>
          </details>
        )}
      </div>
    </motion.article>
  );
}

function DetailBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
        {title}
      </p>
      <div className="mt-2 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[rgba(18,28,45,0.06)] bg-[rgba(247,242,235,0.75)] px-3 py-2"
            >
              {item}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-[rgba(18,28,45,0.06)] bg-[rgba(247,242,235,0.75)] px-3 py-2">
            暂无
          </div>
        )}
      </div>
    </section>
  );
}
