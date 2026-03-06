'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  footer?: ReactNode;
  submitDisabled?: boolean;
}

const EXAMPLES = [
  '帮我写一条提示词，让 AI 以资深产品经理身份输出 PRD。',
  '把这段招聘 JD 优化成更专业的人才画像分析任务。',
  '我要做短视频脚本，请帮我把需求改造成高质量提示词。',
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
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
            Prompt Workbench
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-balance text-[var(--ink-strong)]">
            输入原始提示词，生成 4 份候选并由裁判模型排序
          </h2>
        </div>
        <div className="hidden rounded-full border border-white/50 bg-white/70 px-4 py-2 text-sm text-[var(--ink-soft)] shadow-sm md:block">
          默认并行：Qwen / GLM / Kimi / MiniMax
        </div>
      </div>

      <Textarea
        placeholder="例如：我想让 AI 帮我写一份面向投资人的 SaaS 产品介绍，但我要它逻辑清楚、术语专业、结构完整。"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        className="min-h-[220px] rounded-[28px] border-white/60 bg-white/75 px-6 py-5 text-base leading-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur"
        disabled={isLoading}
      />

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 text-sm text-[var(--ink-soft)] transition hover:border-[var(--accent)] hover:text-[var(--ink-strong)]"
            onClick={() => setPrompt(example)}
            disabled={isLoading}
          >
            {example}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
          系统会先并行请求 4 个百炼模型输出结构化优化结果，再用单独裁判模型给出维度评分、排序结论和改进建议。
        </p>
        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isLoading || submitDisabled}
          size="lg"
          className="h-12 rounded-full bg-[var(--accent)] px-6 text-[15px] font-semibold text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]"
        >
          <Sparkles className="mr-2 size-4" />
          {isLoading ? '正在并行优化...' : '开始优化'}
        </Button>
      </div>

      {footer}
    </section>
  );
}
