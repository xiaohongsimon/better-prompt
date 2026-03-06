'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  footer?: ReactNode;
  submitDisabled?: boolean;
}

const EXAMPLES = [
  '让 AI 以资深产品经理身份输出一份结构完整、专业可执行的 PRD。',
  '把这段招聘需求改造成适合 GPT 执行的人才画像分析提示词。',
  '把短视频创意需求重写成能稳定产出分镜脚本的提示词。',
];

export function PromptInput({
  onSubmit,
  isLoading,
  footer,
  submitDisabled = false,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--accent-strong)]">
            Input
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-[var(--ink-strong)]">
            输入原始提示词
          </h2>
        </div>
        <div className="rounded-full border border-[rgba(18,28,45,0.08)] bg-[rgba(255,255,255,0.7)] px-4 py-2 text-sm text-[var(--ink-soft)]">
          先返先看
        </div>
      </div>

      <div className="rounded-[32px] border border-[rgba(255,255,255,0.7)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,243,235,0.78))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <Textarea
          placeholder="例如：我要让 AI 帮我写一份面向投资人的 SaaS 产品介绍，但我要它逻辑清楚、术语专业、结构完整，并能控制输出格式。"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="min-h-[168px] rounded-[24px] border-0 bg-transparent px-4 py-4 text-[17px] leading-8 shadow-none focus-visible:ring-0"
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setPrompt(example)}
            disabled={isLoading}
            className="rounded-full border border-[rgba(18,28,45,0.08)] bg-white/72 px-3 py-1.5 text-sm text-[var(--ink-soft)] transition hover:border-[var(--accent)] hover:text-[var(--ink-strong)]"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-sm leading-6 text-[var(--ink-soft)]">
            四个模型并发优化，全部返回后由 Kimi 进行排序与综合改写。
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isLoading || submitDisabled}
          className="h-14 rounded-full bg-[var(--ink-strong)] px-6 text-[15px] font-semibold text-white hover:bg-[var(--accent-strong)]"
        >
          {isLoading ? (
            <>
              <Sparkles className="mr-2 size-4" />
              正在竞速生成
            </>
          ) : (
            <>
              <ArrowUpRight className="mr-2 size-4" />
              开始优化
            </>
          )}
        </Button>
      </div>

      {footer}
    </section>
  );
}
