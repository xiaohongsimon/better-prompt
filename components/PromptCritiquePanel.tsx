'use client';

import { BookOpen, Sparkles } from 'lucide-react';
import type { CritiqueResponse } from '@/types';

interface PromptCritiquePanelProps {
  loading: boolean;
  critique: CritiqueResponse | null;
}

export function PromptCritiquePanel({ loading, critique }: PromptCritiquePanelProps) {
  return (
    <aside className="rounded-[32px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
      <div className="flex items-center gap-2">
        <BookOpen className="size-4 text-[var(--accent)]" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Prompt Coach
        </p>
      </div>

      <h3 className="mt-3 text-xl font-semibold text-[var(--ink-strong)]">
        输入点评
      </h3>

      <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
        一边生成优化结果，一边解释你的原始提示词哪里好、哪里还可以更专业。
      </p>

      {loading ? (
        <div className="mt-5 space-y-3">
          <div className="rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
            <div className="mb-2 flex items-center gap-2 text-[var(--ink-strong)]">
              <Sparkles className="size-4 text-[var(--accent)]" />
              正在点评你的输入
            </div>
            用户会在这里看到原始提示词的可读性、完整性和可执行性建议。
          </div>
          <div className="h-18 rounded-[22px] bg-[rgba(255,255,255,0.04)]" />
          <div className="h-18 rounded-[22px] bg-[rgba(255,255,255,0.04)]" />
        </div>
      ) : critique ? (
        <div className="mt-5 space-y-4">
          <PanelBlock title={`总体判断 · ${critique.score}/100`}>
            {critique.overallAssessment}
          </PanelBlock>
          <PanelList title="已经做对的地方" items={critique.strengths} />
          <PanelList title="最影响结果的问题" items={critique.issues} />
          <PanelList title="下次优先这样改" items={critique.rewritePrinciples} />
          <PanelBlock title="就地修正示例">
            {critique.quickFixExample}
          </PanelBlock>
        </div>
      ) : (
        <div className="mt-5 rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
          点击优化后，这里会并行出现针对你原始提示词的专业点评。
        </div>
      )}
    </aside>
  );
}

function PanelBlock({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return (
    <section className="rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        {title}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--ink-soft)]">
        {children}
      </p>
    </section>
  );
}

function PanelList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-[18px] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm leading-6 text-[var(--ink-soft)]"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
