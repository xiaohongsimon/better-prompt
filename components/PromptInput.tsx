'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <div className="w-full space-y-4">
      <Textarea
        placeholder="输入你想要优化的提示词..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[150px] text-lg"
        disabled={isLoading}
      />
      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isLoading}
          size="lg"
          className="px-8"
        >
          {isLoading ? '优化中...' : '开始优化'}
        </Button>
      </div>
    </div>
  );
}