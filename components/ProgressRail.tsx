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
    <section className="rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-4">
      <div className="grid gap-3 xl:grid-cols-3">
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
        ? 'bg-[rgb(130,165,255)] animate-pulse'
        : 'bg-[rgba(255,255,255,0.16)]';
  const panelClass =
    status === 'done'
      ? 'border-[rgba(214,185,139,0.26)] bg-[linear-gradient(135deg,rgba(214,185,139,0.16),rgba(255,255,255,0.03))]'
      : status === 'running'
        ? 'border-[rgba(100,133,255,0.26)] bg-[linear-gradient(135deg,rgba(73,107,211,0.22),rgba(255,255,255,0.03))]'
        : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]';

  return (
    <div className={`min-w-[150px] rounded-[20px] border px-4 py-3 ${panelClass}`}>
      <div className="flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${dotClass}`} />
        <span className="text-sm font-medium text-[var(--ink-strong)]">{title}</span>
      </div>
      <div className="mt-2 text-sm text-[var(--ink-soft)]">{detail}</div>
    </div>
  );
}
