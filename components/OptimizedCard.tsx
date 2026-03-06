'use client';

import { motion } from 'framer-motion';
import { Copy, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { JudgeResult, OptimizedResult } from '@/types';

interface OptimizedCardProps {
  result: JudgeResult;
  optimized: OptimizedResult;
}

const RANK_STYLE: Record<number, string> = {
  1: 'border-[var(--gold-line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,244,214,0.95))]',
  2: 'border-[rgba(111,119,138,0.32)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(238,240,245,0.95))]',
  3: 'border-[rgba(181,120,84,0.35)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,232,223,0.95))]',
};

export function OptimizedCard({ result, optimized }: OptimizedCardProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(optimized.optimizedPrompt);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: result.rank * 0.08 }}
    >
      <Card
        className={`overflow-hidden rounded-[30px] border shadow-[0_24px_60px_rgba(28,37,56,0.12)] ${
          RANK_STYLE[result.rank] || 'border-[var(--line)] bg-white/95'
        }`}
      >
        <CardHeader className="gap-4 border-b border-black/5 px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-[var(--accent)] px-3 py-1 text-[var(--accent-foreground)]">
                  #{result.rank}
                </Badge>
                <Badge variant="outline" className="rounded-full border-[var(--line)] bg-white/70">
                  {result.provider}
                </Badge>
                <Badge variant="outline" className="rounded-full border-[var(--line)] bg-white/70">
                  {result.score} / 100
                </Badge>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-[var(--ink-strong)]">
                  {result.modelName}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">
                  {result.verdict}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleCopy}
              className="rounded-full border-[var(--line)] bg-white/80"
            >
              <Copy className="mr-2 size-4" />
              复制提示词
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-[1.35fr_0.95fr]">
            <section className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-soft)] p-5">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="size-4 text-[var(--accent-strong)]" />
                <p className="text-sm font-semibold text-[var(--ink-strong)]">优化后的提示词</p>
              </div>
              <p className="whitespace-pre-wrap text-[15px] leading-7 text-[var(--ink-strong)]">
                {optimized.optimizedPrompt}
              </p>
            </section>

            <section className="space-y-4">
              <div className="rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
                <p className="text-sm font-semibold text-[var(--ink-strong)]">优化策略</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                  {optimized.strategySummary}
                </p>
              </div>

              <div className="rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
                <p className="text-sm font-semibold text-[var(--ink-strong)]">裁判点评要点</p>
                <div className="mt-3 grid grid-cols-5 gap-2 text-center text-xs">
                  <Metric label="清晰度" value={result.dimensionScores.clarity} />
                  <Metric label="完整性" value={result.dimensionScores.completeness} />
                  <Metric label="可控性" value={result.dimensionScores.controllability} />
                  <Metric label="专业度" value={result.dimensionScores.professionality} />
                  <Metric label="可执行" value={result.dimensionScores.executionLikelihood} />
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <BulletPanel title="本版优势" items={result.strengths} tone="success" />
            <BulletPanel title="不足之处" items={result.weaknesses} tone="warning" />
            <BulletPanel title="下一步可改进" items={result.improvementFocus} tone="neutral" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <BulletPanel title="关键升级点" items={optimized.keyUpgrades} tone="neutral" />
            <BulletPanel title="适用场景" items={optimized.applicableScenarios} tone="neutral" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] px-2 py-3">
      <div className="text-base font-semibold text-[var(--ink-strong)]">{value}</div>
      <div className="mt-1 text-[11px] text-[var(--ink-soft)]">{label}</div>
    </div>
  );
}

function BulletPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'success' | 'warning' | 'neutral';
}) {
  const toneClass =
    tone === 'success'
      ? 'bg-[rgba(216,244,230,0.72)]'
      : tone === 'warning'
        ? 'bg-[rgba(255,236,214,0.82)]'
        : 'bg-white/80';

  return (
    <section className={`rounded-[24px] border border-[var(--line)] p-5 ${toneClass}`}>
      <p className="text-sm font-semibold text-[var(--ink-strong)]">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--ink-soft)]">
        {items.length > 0 ? (
          items.map((item) => (
            <li key={item} className="rounded-2xl bg-white/60 px-3 py-2">
              {item}
            </li>
          ))
        ) : (
          <li className="rounded-2xl bg-white/60 px-3 py-2">暂无</li>
        )}
      </ul>
    </section>
  );
}
