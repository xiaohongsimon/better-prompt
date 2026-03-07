'use client';
import type { OptimizedResult } from '@/types';

interface ProgressRailProps {
  results: OptimizedResult[];
  judgeStatus: 'idle' | 'running' | 'done';
  optimizeSeconds: number;
}

export function ProgressRail({
  results,
  judgeStatus,
  optimizeSeconds,
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
    },
  ];

  if (judgeStatus !== 'idle') {
    stages.push({
      key: 'judge',
      label: '综合定稿',
      active: true,
      complete: judgeStatus === 'done',
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

      <div className="mt-4 text-sm text-[var(--ink-soft)]">
        已完成 {finished}/{total} 路候选，当前竞速计时 {formatSeconds(optimizeSeconds)}。
      </div>
    </section>
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
