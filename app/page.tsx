'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PromptInput } from '@/components/PromptInput';
import { RankingList } from '@/components/RankingList';
import { LoadingState } from '@/components/LoadingState';
import { SettingsModal } from '@/components/SettingsModal';
import type { OptimizedResult, JudgeResult } from '@/types';

interface ApiKeys {
  anthropic: string;
  openai: string;
  google: string;
  zhipu: string;
}

const STORAGE_KEY = 'betterprompt_api_keys';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<OptimizedResult[]>([]);
  const [rankings, setRankings] = useState<JudgeResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    anthropic: '',
    openai: '',
    google: '',
    zhipu: '',
  });

  // Load API keys from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setApiKeys(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved API keys');
      }
    }
  }, []);

  const handleSaveKeys = (keys: ApiKeys) => {
    setApiKeys(keys);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  };

  const handleSubmit = async (prompt: string) => {
    // Check if at least one key is configured
    if (!apiKeys.anthropic && !apiKeys.openai && !apiKeys.google) {
      setError('请先在设置中配置至少一个模型的 API Key');
      return;
    }
    if (!apiKeys.zhipu) {
      setError('请先在设置中配置智谱 AI 的 API Key（用于评分）');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setRankings([]);

    try {
      // Step 1: Optimize with all models
      const optimizeRes = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, apiKeys }),
      });

      if (!optimizeRes.ok) {
        const errData = await optimizeRes.json();
        throw new Error(errData.error || 'Failed to optimize prompt');
      }

      const optimizeData = await optimizeRes.json();
      setResults(optimizeData.results);

      // Step 2: Judge the results
      const judgeRes = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: prompt,
          candidates: optimizeData.results,
          apiKey: apiKeys.zhipu,
        }),
      });

      if (!judgeRes.ok) {
        const errData = await judgeRes.json();
        throw new Error(errData.error || 'Failed to judge prompts');
      }

      const judgeData = await judgeRes.json();
      setRankings(judgeData.rankings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResults([]);
    setRankings([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BetterPrompt
            </h1>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="设置"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
          <p className="text-lg text-muted-foreground">
            输入你的提示词，让多个 AI 模型为你优化，并由 GLM-5 评分排序
          </p>
        </motion.div>

        {/* Input Section */}
        {rankings.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-2xl shadow-xl p-8 mb-8"
          >
            <PromptInput onSubmit={handleSubmit} isLoading={isLoading} />
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && <LoadingState />}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-destructive/10 text-destructive rounded-lg p-4 text-center mb-8"
          >
            {error}
          </motion.div>
        )}

        {/* Results Section */}
        {rankings.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex justify-end mb-4">
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← 重新开始
              </button>
            </div>
            <RankingList rankings={rankings} results={results} />
          </motion.div>
        )}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16 text-sm text-muted-foreground"
        >
          <p>支持模型：Claude · GPT-4 · Gemini | 裁判：GLM-5</p>
        </motion.footer>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveKeys}
        initialKeys={apiKeys}
      />
    </div>
  );
}