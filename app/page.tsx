'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, Settings, SlidersHorizontal } from 'lucide-react';
import { LoadingState } from '@/components/LoadingState';
import { PromptInput } from '@/components/PromptInput';
import { RankingList } from '@/components/RankingList';
import { SettingsModal } from '@/components/SettingsModal';
import {
  DEFAULT_JUDGE_SYSTEM_PROMPT,
  DEFAULT_OPTIMIZER_SYSTEM_PROMPT,
} from '@/lib/prompts/optimizer';
import {
  BAILIAN_BASE_URL,
  DEFAULT_JUDGE_MODEL,
  DEFAULT_OPTIMIZER_MODEL_IDS,
  type ApiConfig,
  type JudgeResult,
  type JudgeResponse,
  type OptimizeResponse,
  type OptimizedResult,
} from '@/types';

const STORAGE_KEY = 'betterprompt_config_v2';

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

export default function Home() {
  const isProduction = process.env.NODE_ENV === 'production';
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    setResults([]);
    setRankings([]);
    setJudgeSummary('');

    try {
      const optimizeRes = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, config }),
      });

      const optimizeData = (await optimizeRes.json()) as OptimizeResponse & { error?: string };
      if (!optimizeRes.ok) {
        throw new Error(optimizeData.error || 'Failed to optimize prompt');
      }

      setResults(optimizeData.results);

      const judgeRes = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: prompt,
          candidates: optimizeData.results,
          config,
          submissionProof: optimizeData.submissionProof,
        }),
      });

      const judgeData = (await judgeRes.json()) as JudgeResponse & { error?: string };
      if (!judgeRes.ok) {
        throw new Error(judgeData.error || 'Failed to judge prompts');
      }

      setRankings(judgeData.rankings);
      setJudgeSummary(judgeData.judgeSummary || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setError(null);
    setIsLoading(false);
    setOriginalPrompt('');
    setResults([]);
    setRankings([]);
    setJudgeSummary('');
  };

  const failureCount = results.filter((result) => result.error).length;
  const bestRanking = rankings[0];
  const bestResult = bestRanking
    ? results.find((result) => result.model === bestRanking.model)
    : undefined;

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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(233,176,109,0.28),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(85,118,150,0.22),transparent_24%),linear-gradient(180deg,rgba(255,250,241,0.95),rgba(244,238,228,0.95))]" />
      <div className="pointer-events-none absolute left-[-8%] top-[18%] h-80 w-80 rounded-full bg-[rgba(202,97,44,0.12)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-10%] top-24 h-96 w-96 rounded-full bg-[rgba(66,88,123,0.14)] blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 md:px-8 md:py-10">
        <motion.header
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-5 rounded-[34px] border border-white/60 bg-white/70 p-6 shadow-[0_25px_80px_rgba(34,41,57,0.14)] backdrop-blur md:grid-cols-[1.2fr_0.8fr]"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-[var(--accent-strong)]">
              BetterPrompt Studio
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-balance md:text-5xl">
              输入一句原始提示词，输出四个优化版本和一份专业裁判报告
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
              面向 Vercel 部署场景设计，兼容百炼 Coding Plan。前端负责体验，服务端统一走 OpenAI 兼容接口，支持可配置模型、温度、Token 和两份核心系统提示词。
            </p>
          </div>

          <div className="grid gap-4 rounded-[28px] border border-[var(--line)] bg-[var(--panel-soft)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">当前工作流</p>
                <p className="text-sm text-[var(--ink-soft)]">
                  4 个优化模型并行 + 1 个裁判模型排序
                </p>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm text-[var(--ink-strong)] transition hover:border-[var(--accent)]"
              >
                <Settings className="size-4" />
                设置
              </button>
            </div>

            <div className="grid gap-3 text-sm text-[var(--ink-soft)]">
              <MetricRow label="优化模型" value={config.optimizerModels.join(' / ')} />
              <MetricRow label="裁判模型" value={config.judgeModel} />
              <MetricRow label="Base URL" value={config.baseUrl || '使用服务端环境变量'} />
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-white/85 p-4 text-sm leading-6 text-[var(--ink-soft)]">
              产品定位：帮助用户在一个界面里快速比较不同大模型对同一提示词的优化风格，并直接看到裁判给出的优劣分析，降低人工比对成本。
            </div>
          </div>
        </motion.header>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="space-y-6"
          >
            <div className="rounded-[34px] border border-white/60 bg-white/72 p-6 shadow-[0_24px_70px_rgba(34,41,57,0.1)] backdrop-blur">
              <PromptInput
                onSubmit={handleSubmit}
                isLoading={isLoading}
                footer={
                  <div className="space-y-3">
                    {isProduction ? (
                      <div className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm leading-6 text-[var(--ink-soft)]">
                        公开访问模式已启用服务端密钥保护、IP 限流、请求来源校验与短期评审凭证。百炼 API Key 不会下发到浏览器。
                      </div>
                    ) : (
                      <div className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm leading-6 text-[var(--ink-soft)]">
                        当前是开发模式，可直接使用本地设置或服务端环境变量。
                      </div>
                    )}
                  </div>
                }
              />
            </div>

            <div className="rounded-[34px] border border-white/60 bg-white/72 p-6 shadow-[0_24px_70px_rgba(34,41,57,0.1)] backdrop-blur">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-[var(--accent-strong)]" />
                <h2 className="text-lg font-semibold">产品设计要点</h2>
              </div>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-[var(--ink-soft)]">
                <InfoCard
                  title="并行优化"
                  body="默认固定四个候选来源，方便比较模型风格差异，而不是只看单一答案。"
                />
                <InfoCard
                  title="结构化裁判"
                  body="裁判输出总分、维度分、优点、不足和改进方向，结果能直接用于产品展示。"
                />
                <InfoCard
                  title="百炼适配"
                  body="接口、模型列表、Key、Prompt、Temperature、Max Tokens 均可调，适合你后续继续试模型。"
                />
              </div>
            </div>
          </motion.section>

          <section className="space-y-6">
            {isLoading && <LoadingState />}

            {error && (
              <div className="rounded-[28px] border border-[rgba(180,58,38,0.15)] bg-[rgba(255,235,231,0.92)] px-5 py-4 text-sm leading-6 text-[rgb(132,39,27)]">
                {error}
              </div>
            )}

            {!isLoading && rankings.length > 0 && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/60 bg-white/72 px-5 py-4 shadow-[0_20px_60px_rgba(34,41,57,0.08)] backdrop-blur">
                  <div className="text-sm text-[var(--ink-soft)]">
                    原始提示词长度：{originalPrompt.length} 字符
                    {failureCount > 0 ? ` · ${failureCount} 个模型返回失败` : ' · 4 个候选已完成评分'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCopyBest}
                      disabled={!bestResult?.optimizedPrompt}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Copy className="size-4" />
                      复制最佳版本
                    </button>
                    <button
                      onClick={handleExportMarkdown}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm text-[var(--ink-strong)]"
                    >
                      <Download className="size-4" />
                      导出 Markdown 报告
                    </button>
                    <button
                      onClick={handleReset}
                      className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm text-[var(--ink-strong)]"
                    >
                      重新开始
                    </button>
                  </div>
                </div>
                <RankingList rankings={rankings} results={results} judgeSummary={judgeSummary} />
              </>
            )}

            {!isLoading && !error && rankings.length === 0 && (
              <div className="rounded-[34px] border border-dashed border-[var(--line)] bg-white/50 p-8 text-sm leading-7 text-[var(--ink-soft)]">
                结果区会按排名展示四个候选版本，每张卡片都会包含优化后的提示词、裁判评分维度、优点、不足与改进方向。
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

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3">
      <span className="text-[var(--ink-strong)]">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
      <div className="font-medium text-[var(--ink-strong)]">{title}</div>
      <div className="mt-1 text-[var(--ink-soft)]">{body}</div>
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
    ...rankings.flatMap((ranking) => {
      const optimized = results.find((result) => result.model === ranking.model);

      if (!optimized) {
        return [
          `### ${ranking.modelName}`,
          '',
          '未找到候选内容。',
          '',
        ];
      }

      return [
        `### ${ranking.modelName}`,
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
      ];
    }),
  ];

  return sections.join('\n');
}
