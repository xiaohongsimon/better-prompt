'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, RotateCcw, Settings } from 'lucide-react';
import { PromptInput } from '@/components/PromptInput';
import { RankingList } from '@/components/RankingList';
import { SettingsModal } from '@/components/SettingsModal';
import {
  DEFAULT_JUDGE_SYSTEM_PROMPT,
  DEFAULT_OPTIMIZER_SYSTEM_PROMPT,
} from '@/lib/prompts/optimizer';
import {
  AVAILABLE_MODELS,
  BAILIAN_BASE_URL,
  DEFAULT_JUDGE_MODEL,
  DEFAULT_OPTIMIZER_MODEL_IDS,
  type ApiConfig,
  type JudgeResponse,
  type JudgeResult,
  type OptimizedResult,
} from '@/types';

const STORAGE_KEY = 'betterprompt_config_v4';

const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: BAILIAN_BASE_URL,
  apiKey: '',
  optimizerModels: DEFAULT_OPTIMIZER_MODEL_IDS,
  judgeModel: DEFAULT_JUDGE_MODEL,
  optimizerTemperature: 0.7,
  optimizerMaxTokens: 2200,
  judgeTemperature: 0.2,
  judgeMaxTokens: 2400,
  optimizerSystemPrompt: DEFAULT_OPTIMIZER_SYSTEM_PROMPT,
  judgeSystemPrompt: DEFAULT_JUDGE_SYSTEM_PROMPT,
};

type Phase = 'idle' | 'optimizing' | 'judging' | 'done';

export default function Home() {
  const isProduction = process.env.NODE_ENV === 'production';
  const [phase, setPhase] = useState<Phase>('idle');
  const [results, setResults] = useState<OptimizedResult[]>([]);
  const [rankings, setRankings] = useState<JudgeResult[]>([]);
  const [judgeSummary, setJudgeSummary] = useState('');
  const [synthesizedBestPrompt, setSynthesizedBestPrompt] = useState('');
  const [synthesisRationale, setSynthesisRationale] = useState('');
  const [appliedAdvantages, setAppliedAdvantages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<ApiConfig>(DEFAULT_CONFIG);
  const [originalPrompt, setOriginalPrompt] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Partial<ApiConfig>;
      setConfig({ ...DEFAULT_CONFIG, ...parsed });
    } catch {
      console.error('Failed to restore config from local storage');
    }
  }, []);

  const handleSaveConfig = (nextConfig: ApiConfig) => {
    setConfig(nextConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig));
  };

  const handleSubmit = async (prompt: string) => {
    if (config.optimizerModels.length === 0) {
      setError('请至少选择一个优化模型。');
      return;
    }

    if (!config.judgeModel) {
      setError('请配置裁判模型。');
      return;
    }

    setOriginalPrompt(prompt);
    setError(null);
    setResults([]);
    setRankings([]);
    setJudgeSummary('');
    setSynthesizedBestPrompt('');
    setSynthesisRationale('');
    setAppliedAdvantages([]);
    setPhase('optimizing');

    try {
      const settledResults = await Promise.all(
        config.optimizerModels.map(async (modelId) => {
          try {
            const response = await fetch('/api/optimize-single', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt, config, modelId }),
            });

            const payload = (await response.json()) as { result?: OptimizedResult; error?: string };
            const fallbackMeta = AVAILABLE_MODELS.find((model) => model.id === modelId);
            const result =
              payload.result ||
              ({
                model: modelId,
                modelName: fallbackMeta?.name || modelId,
                provider: fallbackMeta?.provider || 'Unknown',
                optimizedPrompt: '',
                strategySummary: '',
                keyUpgrades: [],
                applicableScenarios: [],
                error: payload.error || '请求失败',
              } satisfies OptimizedResult);

            setResults((previous) => [...previous, result]);
            return result;
          } catch (requestError) {
            const fallbackMeta = AVAILABLE_MODELS.find((model) => model.id === modelId);
            const result = {
              model: modelId,
              modelName: fallbackMeta?.name || modelId,
              provider: fallbackMeta?.provider || 'Unknown',
              optimizedPrompt: '',
              strategySummary: '',
              keyUpgrades: [],
              applicableScenarios: [],
              error: requestError instanceof Error ? requestError.message : '请求失败',
            } satisfies OptimizedResult;

            setResults((previous) => [...previous, result]);
            return result;
          }
        })
      );

      const validCandidates = settledResults.filter(
        (result) => result.optimizedPrompt && !result.error
      );

      if (validCandidates.length === 0) {
        const details = settledResults
          .map((result) => `${result.modelName}: ${result.error || '未返回可用结果'}`)
          .join('；');
        throw new Error(`所有优化模型都未返回可评审候选。${details}`);
      }

      setPhase('judging');

      const proofRes = await fetch('/api/create-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: prompt,
          candidates: validCandidates,
        }),
      });
      const proofData = (await proofRes.json()) as { submissionProof?: string; error?: string };
      if (!proofRes.ok || !proofData.submissionProof) {
        throw new Error(proofData.error || 'Failed to create proof');
      }

      const judgeRes = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: prompt,
          candidates: validCandidates,
          config,
          submissionProof: proofData.submissionProof,
        }),
      });

      const judgeData = (await judgeRes.json()) as JudgeResponse & { error?: string };
      if (!judgeRes.ok) {
        throw new Error(judgeData.error || 'Failed to judge prompts');
      }

      setRankings(judgeData.rankings);
      setJudgeSummary(judgeData.judgeSummary || '');
      setSynthesizedBestPrompt(judgeData.synthesizedBestPrompt || '');
      setSynthesisRationale(judgeData.synthesisRationale || '');
      setAppliedAdvantages(judgeData.appliedAdvantages || []);
      setPhase('done');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'An unexpected error occurred');
      setPhase('idle');
    }
  };

  const handleReset = () => {
    setError(null);
    setOriginalPrompt('');
    setResults([]);
    setRankings([]);
    setJudgeSummary('');
    setSynthesizedBestPrompt('');
    setSynthesisRationale('');
    setAppliedAdvantages([]);
    setPhase('idle');
  };

  const bestRanking = rankings[0];
  const bestResult = bestRanking
    ? results.find((result) => result.model === bestRanking.model)
    : undefined;

  const handleCopyBest = async () => {
    const value = synthesizedBestPrompt || bestResult?.optimizedPrompt;
    if (!value) return;
    await navigator.clipboard.writeText(value);
  };

  const handleExportMarkdown = () => {
    const markdown = buildMarkdownReport({
      originalPrompt,
      judgeSummary,
      rankings,
      results,
      synthesizedBestPrompt,
      synthesisRationale,
      appliedAdvantages,
    });

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    link.href = url;
    link.download = `betterprompt-report-${stamp}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--page-bg)] text-[var(--ink-strong)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(220,160,94,0.18),transparent_24%),radial-gradient(circle_at_85%_12%,rgba(78,106,137,0.12),transparent_18%),linear-gradient(180deg,#f4efe6_0%,#f1ebe2_100%)]" />

      <div className="relative mx-auto max-w-[1480px] px-5 py-6 md:px-8 md:py-8">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-start justify-between gap-6 rounded-[36px] border border-white/70 bg-white/58 px-6 py-6 shadow-[0_20px_80px_rgba(22,32,45,0.06)] backdrop-blur"
        >
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-strong)]">
              BetterPrompt
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)] md:text-5xl">
              多模型提示词优化工作台
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
              四个模型并发重写，Kimi 负责排序与综合定稿。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyBest}
              disabled={!synthesizedBestPrompt && !bestResult?.optimizedPrompt}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/82 px-4 py-2 text-sm text-[var(--ink-strong)] disabled:opacity-40"
            >
              <Copy className="size-4" />
              复制最佳版
            </button>
            <button
              onClick={handleExportMarkdown}
              disabled={results.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/82 px-4 py-2 text-sm text-[var(--ink-strong)] disabled:opacity-40"
            >
              <Download className="size-4" />
              导出
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/82 px-4 py-2 text-sm text-[var(--ink-strong)]"
            >
              <RotateCcw className="size-4" />
              重置
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/82 px-4 py-2 text-sm text-[var(--ink-strong)]"
            >
              <Settings className="size-4" />
              设置
            </button>
          </div>
        </motion.header>

        <section className="mt-6 rounded-[36px] border border-white/70 bg-white/62 p-6 shadow-[0_20px_80px_rgba(22,32,45,0.06)] backdrop-blur">
          <PromptInput
            onSubmit={handleSubmit}
            isLoading={phase === 'optimizing' || phase === 'judging'}
            footer={
              <div className="rounded-[26px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
                {isProduction
                  ? '公开访问模式启用服务端密钥保护与限流，用户端不会接触百炼 API Key。'
                  : '开发模式下可使用本地配置或服务端环境变量。'}
              </div>
            }
          />
        </section>

        <section className="mt-6">
          {error ? (
            <div className="mb-6 rounded-[28px] border border-[rgba(180,58,38,0.12)] bg-[rgba(255,241,237,0.9)] px-5 py-4 text-sm leading-6 text-[rgb(132,39,27)]">
              {error}
            </div>
          ) : null}

          {results.length > 0 ? (
            <RankingList
              rankings={rankings}
              results={results}
              judgeSummary={judgeSummary}
              judgeStatus={phase === 'judging' ? 'running' : rankings.length > 0 ? 'done' : 'idle'}
              synthesizedBestPrompt={synthesizedBestPrompt}
              synthesisRationale={synthesisRationale}
              appliedAdvantages={appliedAdvantages}
            />
          ) : (
            <div className="rounded-[34px] border border-dashed border-[var(--line)] bg-white/36 px-8 py-16 text-center text-sm leading-7 text-[var(--ink-soft)]">
              结果区会先展示四个模型卡片，再在最下方给出 Kimi 的排序与综合版本。
            </div>
          )}
        </section>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveConfig}
        initialConfig={config}
      />
    </main>
  );
}

function buildMarkdownReport({
  originalPrompt,
  judgeSummary,
  rankings,
  results,
  synthesizedBestPrompt,
  synthesisRationale,
  appliedAdvantages,
}: {
  originalPrompt: string;
  judgeSummary: string;
  rankings: JudgeResult[];
  results: OptimizedResult[];
  synthesizedBestPrompt: string;
  synthesisRationale: string;
  appliedAdvantages: string[];
}) {
  const sections = [
    '# BetterPrompt Report',
    '',
    '## 原始提示词',
    '',
    originalPrompt,
    '',
    '## Kimi 综合最佳版',
    '',
    synthesizedBestPrompt || '暂无',
    '',
    '## 综合逻辑',
    '',
    synthesisRationale || '暂无',
    '',
    ...(appliedAdvantages.length
      ? ['## 吸收的优点', '', ...appliedAdvantages.map((item) => `- ${item}`), '']
      : []),
    '## 排名总览',
    '',
    ...rankings.flatMap((ranking) => [
      `### #${ranking.rank} ${ranking.modelName}`,
      '',
      `- 总分：${ranking.score}`,
      `- 结论：${ranking.verdict}`,
      '',
    ]),
    '## 裁判总结',
    '',
    judgeSummary || '暂无',
    '',
    '## 全部候选详情',
    '',
    ...results.flatMap((optimized) => [
      `### ${optimized.modelName}`,
      '',
      '```text',
      optimized.optimizedPrompt || optimized.error || '暂无',
      '```',
      '',
    ]),
  ];

  return sections.join('\n');
}
