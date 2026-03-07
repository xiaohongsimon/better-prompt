'use client';

interface ProgressRailProps {
  critiqueLoading: boolean;
  critiqueReady: boolean;
  completedModels: number;
  totalModels: number;
  judgeStatus: 'idle' | 'running' | 'done';
  critiqueSeconds: number;
  optimizeSeconds: number;
  judgeSeconds: number;
}

export function ProgressRail({
  critiqueLoading,
  critiqueReady,
  completedModels,
  totalModels,
  judgeStatus,
  critiqueSeconds,
  optimizeSeconds,
  judgeSeconds,
}: ProgressRailProps) {
  return (
    <section className="rounded-[24px] border border-[rgba(214,185,139,0.16)] bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(214,185,139,0.1))] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
      <div className="grid gap-3 xl:grid-cols-3">
        <Step
          title="输入点评"
          status={critiqueReady ? 'done' : critiqueLoading ? 'running' : 'idle'}
          detail={
            critiqueReady
              ? `${formatSeconds(critiqueSeconds)} 完成`
              : critiqueLoading
                ? `${formatSeconds(critiqueSeconds)}`
                : '待开始'
          }
        />
        <Step
          title="并行优化"
          status={completedModels === totalModels && totalModels > 0 ? 'done' : completedModels > 0 ? 'running' : 'idle'}
          detail={`${completedModels}/${totalModels} · ${formatSeconds(optimizeSeconds)}`}
        />
        <Step
          title="综合裁判"
          status={judgeStatus}
          detail={
            judgeStatus === 'done'
              ? `${formatSeconds(judgeSeconds)} 完成`
              : judgeStatus === 'running'
                ? `${formatSeconds(judgeSeconds)}`
                : '待开始'
          }
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
      ? 'border-[rgba(214,185,139,0.4)] bg-[linear-gradient(135deg,rgba(214,185,139,0.22),rgba(255,255,255,0.04))]'
      : status === 'running'
        ? 'border-[rgba(100,133,255,0.38)] bg-[linear-gradient(135deg,rgba(73,107,211,0.34),rgba(255,255,255,0.05))]'
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

function formatSeconds(value: number) {
  return `${value.toFixed(1)} 秒`;
}
