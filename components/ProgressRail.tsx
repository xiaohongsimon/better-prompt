'use client';

interface ProgressRailProps {
  critiqueLoading: boolean;
  critiqueReady: boolean;
  completedModels: number;
  totalModels: number;
  judgeStatus: 'idle' | 'running' | 'done';
}

export function ProgressRail({
  critiqueLoading,
  critiqueReady,
  completedModels,
  totalModels,
  judgeStatus,
}: ProgressRailProps) {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-4">
      <div className="flex flex-wrap gap-3">
        <Step
          title="输入点评"
          status={critiqueReady ? 'done' : critiqueLoading ? 'running' : 'idle'}
          detail={critiqueReady ? '已完成' : critiqueLoading ? '分析中' : '待开始'}
        />
        <Step
          title="并行优化"
          status={completedModels === totalModels && totalModels > 0 ? 'done' : completedModels > 0 ? 'running' : 'idle'}
          detail={`${completedModels}/${totalModels}`}
        />
        <Step
          title="综合裁判"
          status={judgeStatus}
          detail={judgeStatus === 'done' ? '已完成' : judgeStatus === 'running' ? '生成中' : '待开始'}
        />
      </div>
    </section>
  );
}

function Step({
  title,
  status,
  detail,
}: {
  title: string;
  status: 'idle' | 'running' | 'done';
  detail: string;
}) {
  const dotClass =
    status === 'done'
      ? 'bg-[var(--accent)]'
      : status === 'running'
        ? 'bg-[var(--ink-strong)] animate-pulse'
        : 'bg-[rgba(255,255,255,0.16)]';

  return (
    <div className="min-w-[150px] flex-1 rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${dotClass}`} />
        <span className="text-sm font-medium text-[var(--ink-strong)]">{title}</span>
      </div>
      <div className="mt-2 text-sm text-[var(--ink-soft)]">{detail}</div>
    </div>
  );
}
