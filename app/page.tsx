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

const STORAGE_KEY = 'betterprompt_config_v3';

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
    setPhase('idle');
  };

  const bestRanking = rankings[0];
  const bestResult = bestRanking
    ? results.find((result) => result.model === bestRanking.model)
    : undefined;
  const returnedCount = results.length;

  const handleCopyBest = async () => {
    if (!bestResult?.optimizedPrompt) return;
    await navigator.clipboard.writeText(bestResult.optimizedPrompt);
  };

  const handleExportMarkdown = () => {
    const markdown = buildMarkdownReport({
      originalPrompt,
      judgeSummary,
      rankings,
      results,
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(241,184,98,0.28),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(74,114,148,0.18),transparent_20%),linear-gradient(180deg,#f5efe3_0%,#f8f4ed_32%,#f2ece3_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(159,76,33,0.35),transparent)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 md:px-8 md:py-8">
        <motion.header
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[36px] border border-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.62)] px-6 py-6 shadow-[0_25px_80px_rgba(24,36,58,0.08)] backdrop-blur"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--accent-strong)]">
                BetterPrompt
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-[1.02] text-[var(--ink-strong)] md:text-6xl">
                让四个模型先竞速，
                <br />
                再让一个裁判定胜负。
              </h1>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(18,28,45,0.08)] bg-white/78 px-4 py-2 text-sm text-[var(--ink-strong)] transition hover:border-[var(--accent)]"
            >
              <Settings className="size-4" />
              设置
            </button>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <StatChip label="优化模型" value={`${config.optimizerModels.length} 并发`} />
            <StatChip label="裁判模型" value={config.judgeModel} />
            <StatChip
              label="返回方式"
              value={phase === 'optimizing' ? '竞速中' : phase === 'judging' ? '裁判中' : '先到先看'}
            />
            <StatChip label="运行环境" value={isProduction ? 'Public / Protected' : 'Development'} />
          </div>
        </motion.header>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[36px] border border-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.66)] p-6 shadow-[0_24px_72px_rgba(24,36,58,0.08)] backdrop-blur"
            >
              <PromptInput
                onSubmit={handleSubmit}
                isLoading={phase === 'optimizing' || phase === 'judging'}
                footer={
                  <div className="rounded-[28px] border border-[rgba(18,28,45,0.08)] bg-[rgba(247,242,235,0.84)] px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
                    默认只把最有价值的信息给用户：先展示四个候选提示词，裁判分数和优缺点在结果卡片里折叠展开。
                  </div>
                }
              />
            </motion.div>

            <div className="grid gap-3">
              <PipelineRow
                title="Model Race"
                hint="四个模型互不等待，先完成先落卡"
                status={`${returnedCount}/${config.optimizerModels.length}`}
              />
              <PipelineRow
                title="Judge"
                hint="四个候选全部到齐后才开始评分"
                status={
                  phase === 'judging'
                    ? 'Running'
                    : phase === 'done'
                      ? 'Done'
                      : returnedCount === config.optimizerModels.length && returnedCount > 0
                        ? 'Queued'
                        : 'Standby'
                }
              />
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[36px] border border-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.66)] px-5 py-5 shadow-[0_24px_72px_rgba(24,36,58,0.08)] backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
                    Live Board
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                    {phase === 'optimizing'
                      ? '模型正在并发返回。结果会按完成顺序出现在下面。'
                      : phase === 'judging'
                        ? '四个候选都已可见，裁判正在生成最终排名。'
                        : '先看原始结果，再决定要不要展开细节。'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyBest}
                    disabled={!bestResult?.optimizedPrompt}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(18,28,45,0.08)] bg-white/78 px-4 py-2 text-sm text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Copy className="size-4" />
                    复制最佳版本
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    disabled={results.length === 0}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(18,28,45,0.08)] bg-white/78 px-4 py-2 text-sm text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download className="size-4" />
                    导出报告
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(18,28,45,0.08)] bg-white/78 px-4 py-2 text-sm text-[var(--ink-strong)]"
                  >
                    <RotateCcw className="size-4" />
                    重置
                  </button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-[30px] border border-[rgba(180,58,38,0.12)] bg-[rgba(255,240,236,0.9)] px-5 py-4 text-sm leading-6 text-[rgb(132,39,27)]">
                {error}
              </div>
            ) : null}

            {results.length > 0 ? (
              <RankingList
                rankings={rankings}
                results={results}
                judgeSummary={judgeSummary}
                judgeStatus={phase === 'judging' ? 'running' : rankings.length > 0 ? 'done' : 'idle'}
              />
            ) : (
              <div className="rounded-[36px] border border-dashed border-[rgba(18,28,45,0.12)] bg-[rgba(255,255,255,0.44)] px-8 py-14 text-center text-sm leading-7 text-[var(--ink-soft)]">
                这里会先出现四张候选卡片。哪个模型先返回，哪个先显示。裁判不会阻塞结果展示。
              </div>
            )}
          </section>
        </div>
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

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[26px] border border-[rgba(18,28,45,0.08)] bg-[rgba(247,242,235,0.82)] px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
        {label}
      </div>
      <div className="mt-2 truncate text-sm text-[var(--ink-strong)]">{value}</div>
    </div>
  );
}

function PipelineRow({
  title,
  hint,
  status,
}: {
  title: string;
  hint: string;
  status: string;
}) {
  return (
    <div className="rounded-[30px] border border-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.62)] px-5 py-5 shadow-[0_18px_60px_rgba(24,36,58,0.06)] backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--ink-strong)]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">{hint}</p>
        </div>
        <div className="rounded-full border border-[rgba(18,28,45,0.08)] bg-[rgba(247,242,235,0.82)] px-3 py-1 text-sm text-[var(--ink-soft)]">
          {status}
        </div>
      </div>
    </div>
  );
}

function buildMarkdownReport({
  originalPrompt,
  judgeSummary,
  rankings,
  results,
}: {
  originalPrompt: string;
  judgeSummary: string;
  rankings: JudgeResult[];
  results: OptimizedResult[];
}) {
  const sections = [
    '# BetterPrompt Report',
    '',
    '## 原始提示词',
    '',
    originalPrompt,
    '',
    '## 裁判总结',
    '',
    judgeSummary || '暂无',
    '',
    '## 排名总览',
    '',
    ...rankings.flatMap((ranking) => [
      `### #${ranking.rank} ${ranking.modelName} (${ranking.provider})`,
      '',
      `- 总分：${ranking.score}`,
      `- 结论：${ranking.verdict}`,
      `- 维度分：清晰度 ${ranking.dimensionScores.clarity} / 完整性 ${ranking.dimensionScores.completeness} / 可控性 ${ranking.dimensionScores.controllability} / 专业度 ${ranking.dimensionScores.professionality} / 可执行性 ${ranking.dimensionScores.executionLikelihood}`,
      `- 优势：${ranking.strengths.join('；') || '暂无'}`,
      `- 不足：${ranking.weaknesses.join('；') || '暂无'}`,
      `- 改进方向：${ranking.improvementFocus.join('；') || '暂无'}`,
      '',
    ]),
    '## 全部候选详情',
    '',
    ...results.flatMap((optimized) => [
      `### ${optimized.modelName}`,
      '',
      `- 模型 ID：${optimized.model}`,
      `- 优化策略：${optimized.strategySummary || '暂无'}`,
      `- 关键升级点：${optimized.keyUpgrades.join('；') || '暂无'}`,
      `- 适用场景：${optimized.applicableScenarios.join('；') || '暂无'}`,
      '',
      '#### 优化后的提示词',
      '',
      '```text',
      optimized.optimizedPrompt || optimized.error || '暂无',
      '```',
      '',
    ]),
  ];

  return sections.join('\n');
}
