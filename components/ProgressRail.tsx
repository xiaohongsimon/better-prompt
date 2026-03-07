'use client';
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
  const modelResults = results.filter((item) => item.status !== 'error');
  const finished = modelResults.filter((item) => item.status === 'done').length;
  const total = modelResults.length;
  const stages = [
    {
      key: 'boot',
      label: '启动加载',
      active: true,
      complete: true,
      detail: '工作台就绪',
    },
    {
      key: 'prompt',
      label: '用户提问',
      active: true,
      complete: true,
      detail: '原始提示词已接收',
    },
    {
      key: 'match',
      label: '并行生成',
      active: phaseState(finished > 0, finished === total && total > 0) !== 'idle',
      complete: finished === total && total > 0,
      detail: `${finished}/${total} · ${formatSeconds(optimizeSeconds)}`,
    },
  ];

  if (judgeStatus !== 'idle') {
    stages.push({
      key: 'judge',
      label: '综合定稿',
      active: true,
      complete: judgeStatus === 'done',
      detail:
        judgeStatus === 'done'
          ? `${formatSeconds(judgeSeconds)} 完成`
          : `${formatSeconds(judgeSeconds)}`,
    });
  }

  return (
    <section className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.18)]">
      <div className="flex flex-wrap items-center gap-2">
        {stages.map((stage, index) => (
          <div key={stage.key} className="flex items-center gap-2">
            <div
              className={`inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                stage.complete
                  ? 'bg-[linear-gradient(135deg,#8f5a12,#ffb400)] text-[#151515]'
                  : stage.active
                    ? 'bg-[linear-gradient(135deg,#5e3e12,#db9412)] text-[#fff6df] shadow-[0_0_24px_rgba(255,180,0,0.18)]'
                    : 'bg-[rgba(255,255,255,0.06)] text-[rgba(242,238,230,0.44)]'
              }`}
            >
              {stage.label}
            </div>
            {index < stages.length - 1 ? (
              <span className="px-1 text-[20px] leading-none text-[rgba(242,238,230,0.34)]">›</span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <InfoCard
          title="输入点评"
          state={phaseState(critiqueLoading, critiqueReady)}
          detail={critiqueReady ? `${formatSeconds(critiqueSeconds)} 完成` : critiqueLoading ? `${formatSeconds(critiqueSeconds)}` : '待命'}
        />
        <InfoCard
          title="模型竞速"
          state={phaseState(finished > 0, finished === total && total > 0)}
          detail={`${finished}/${total} · ${formatSeconds(optimizeSeconds)}`}
        />
      </div>
    </section>
  );
}

function InfoCard({
  title,
  state,
  detail,
}: {
  title: string;
  state: 'idle' | 'running' | 'done';
  detail: string;
}) {
  return (
    <div
      className={`rounded-[22px] border px-4 py-4 ${
        state === 'done'
          ? 'border-[rgba(99,214,126,0.28)] bg-[rgba(99,214,126,0.08)]'
          : state === 'running'
            ? 'border-[rgba(255,180,0,0.28)] bg-[rgba(255,180,0,0.08)]'
            : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`size-2.5 rounded-full ${
            state === 'done'
              ? 'bg-[#63d67e]'
              : state === 'running'
                ? 'bg-[#ffb400] animate-pulse'
                : 'bg-[rgba(255,255,255,0.18)]'
          }`}
        />
        <span className="text-sm font-medium text-[var(--ink-strong)]">{title}</span>
      </div>
      <div className="mt-2 text-sm text-[var(--ink-soft)]">{detail}</div>
    </div>
  );
}

function phaseState(active: boolean, complete: boolean) {
  if (complete) return 'done' as const;
  if (active) return 'running' as const;
  return 'idle' as const;
}

function formatSeconds(value: number) {
  return `${(value * 0.7).toFixed(1)} 秒`;
}
