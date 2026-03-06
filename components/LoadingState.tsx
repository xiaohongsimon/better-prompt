'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const STEPS = [
  'Qwen 正在重写提示词',
  'GLM 正在补全结构与约束',
  'Kimi 正在优化表达与专业度',
  'MiniMax 正在强化执行性',
  '裁判模型正在评分排序',
];

export function LoadingState() {
  return (
    <div className="space-y-4">
      <Card className="rounded-[28px] border-white/60 bg-white/75 shadow-xl backdrop-blur">
        <CardContent className="space-y-5 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
              Pipeline Running
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--ink-strong)]">
              多模型并行执行中
            </h3>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {STEPS.map((step) => (
              <div
                key={step}
                className="rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-[var(--ink-soft)]">{step}</span>
                  <Skeleton className="h-2.5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
