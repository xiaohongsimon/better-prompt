'use client';

import { TimerReset } from 'lucide-react';
import type { OptimizedResult } from '@/types';

interface ProgressRailProps {
  results: OptimizedResult[];
  critiqueLoading: boolean;
  critiqueReady: boolean;
  judgeStatus: 'idle' | 'running' | 'done';
  critiqueSeconds: number;
  optimizeSeconds: number;
  judgeSeconds: number;
}

export function ProgressRail({
  results,
  critiqueLoading,
  critiqueReady,
  judgeStatus,
  critiqueSeconds,
  optimizeSeconds,
  judgeSeconds,
}: ProgressRailProps) {
  const finished = results.filter((item) => item.status === 'done').length;
  const total = results.length;
  const ranked = results
    .filter((item) => item.completionRank)
    .sort((a, b) => (a.completionRank ?? 99) - (b.completionRank ?? 99));

  return (
    <section className="rounded-[28px] border border-[rgba(214,185,139,0.18)] bg-[linear-gradient(135deg,rgba(12,15,21,0.96),rgba(31,24,18,0.9))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-strong)]">
            Live Race
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
            四路并发优化正在推进
          </h3>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-[var(--ink-soft)]">
          <TimerReset className="size-4 text-[var(--accent)]" />
          20 秒窗口
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-3">
        <Step
          title="输入点评"
          state={critiqueReady ? 'done' : critiqueLoading ? 'running' : 'idle'}
          detail={
            critiqueReady
              ? `${formatSeconds(critiqueSeconds)} 完成`
              : critiqueLoading
                ? `${formatSeconds(critiqueSeconds)}`
                : '待命'
          }
        />
        <Step
          title="模型竞速"
          state={finished === total && total > 0 ? 'done' : finished > 0 ? 'running' : 'idle'}
          detail={`${finished}/${total} · ${formatSeconds(optimizeSeconds)}`}
        />
        <Step
          title="综合裁判"
          state={judgeStatus}
          detail={
            judgeStatus === 'done'
              ? `${formatSeconds(judgeSeconds)} 完成`
              : judgeStatus === 'running'
                ? `${formatSeconds(judgeSeconds)}`
                : '等待候选'
          }
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {ranked.length > 0 ? (
          ranked.map((item) => (
            <div
              key={item.model}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(214,185,139,0.18)] bg-[rgba(214,185,139,0.08)] px-3 py-2 text-sm text-[var(--ink-strong)]"
            >
              <span className="rounded-full bg-[rgba(214,185,139,0.18)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Top {item.completionRank}
              </span>
              <span>{item.modelName}</span>
              <span className="text-[var(--ink-soft)]">{item.latencyMs} ms</span>
            </div>
          ))
        ) : (
          <div className="text-sm text-[var(--ink-soft)]">
            首个结果返回后，这里会形成速度榜。
          </div>
        )}
      </div>
    </section>
  );
}

function Step({
  title,
  state,
  detail,
}: {
  title: string;
  state: 'idle' | 'running' | 'done';
  detail: string;
}) {
  const style =
    state === 'done'
      ? 'border-[rgba(214,185,139,0.34)] bg-[rgba(214,185,139,0.12)]'
      : state === 'running'
        ? 'border-[rgba(79,123,255,0.36)] bg-[rgba(79,123,255,0.16)]'
        : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]';

  return (
    <div className={`rounded-[22px] border px-4 py-4 ${style}`}>
      <div className="flex items-center gap-2">
        <span
          className={`size-2.5 rounded-full ${
            state === 'done'
              ? 'bg-[var(--accent)]'
              : state === 'running'
                ? 'bg-[rgb(132,168,255)] animate-pulse'
                : 'bg-[rgba(255,255,255,0.18)]'
          }`}
        />
        <span className="text-sm font-medium text-[var(--ink-strong)]">{title}</span>
      </div>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">{detail}</p>
    </div>
  );
}

function formatSeconds(value: number) {
  return `${value.toFixed(1)} 秒`;
}
