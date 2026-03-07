'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, RotateCcw, Settings } from 'lucide-react';
import { PromptInput } from '@/components/PromptInput';
import { ProgressRail } from '@/components/ProgressRail';
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
const MODEL_TIMEOUT_MS = 20_000;

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
  const [phase, setPhase] = useState<Phase>('idle');
  const [synthesisStatus, setSynthesisStatus] = useState<'idle' | 'running' | 'done'>('idle');
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
  const [optimizeSeconds, setOptimizeSeconds] = useState(0);
  const [judgeSeconds, setJudgeSeconds] = useState(0);
  const [nowMs, setNowMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const judgeStartedAtRef = useRef<number | null>(null);
  const raceRankRef = useRef(0);
  const judgeTriggeredRef = useRef(false);
  const synthesizedCandidateCountRef = useRef(0);
  const workbenchRef = useRef<HTMLDivElement | null>(null);
  const statusRailRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    if (phase === 'idle') return;

    const timer = window.setInterval(() => {
      const now = performance.now();
      setNowMs(now);

      if (startedAtRef.current) {
        const elapsed = (now - startedAtRef.current) / 1000;
        setOptimizeSeconds(elapsed);
      }

      if (judgeStartedAtRef.current) {
        const elapsed = (now - judgeStartedAtRef.current) / 1000;
        setJudgeSeconds(elapsed);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [phase]);

  const handleSaveConfig = (nextConfig: ApiConfig) => {
    setConfig(nextConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig));
  };

  const handleSubmit = async (prompt: string) => {
    const activeOptimizerModels = AVAILABLE_MODELS.filter((model) => model.role === 'optimizer');

    if (activeOptimizerModels.length === 0) {
      setError('请至少选择一个优化模型。');
      return;
    }

    setError(null);
    setOriginalPrompt(prompt);
    setRankings([]);
    setJudgeSummary('');
    setSynthesizedBestPrompt('');
    setSynthesisRationale('');
    setAppliedAdvantages([]);
    setOptimizeSeconds(0);
    setJudgeSeconds(0);
    setSynthesisStatus('idle');
    raceRankRef.current = 0;
    judgeTriggeredRef.current = false;
    synthesizedCandidateCountRef.current = 0;
    startedAtRef.current = performance.now();
    judgeStartedAtRef.current = null;
    setPhase('optimizing');
    requestAnimationFrame(() => {
      const target = statusRailRef.current ?? workbenchRef.current;
      if (!target) return;

      const top = target.getBoundingClientRect().top + window.scrollY - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });

    setResults(
      activeOptimizerModels.map((model) => ({
        model: model.id,
        modelName: model.name,
        provider: model.provider,
        optimizedPrompt: '',
        strategySummary: '',
        keyUpgrades: [],
        applicableScenarios: [],
        status: 'streaming',
        startedAtMs: performance.now(),
      }))
    );

    const settled = await Promise.allSettled(
      activeOptimizerModels.map((model) =>
        streamOptimizer({
          modelId: model.id,
          prompt,
          config,
          onDelta: (delta) => {
            setResults((previous) =>
              previous.map((item) =>
                item.model === model.id
                  ? {
                      ...item,
                      status: 'streaming',
                      startedAtMs: item.startedAtMs ?? performance.now(),
                      optimizedPrompt: `${item.optimizedPrompt}${delta}`,
                    }
                  : item
              )
            );
          },
          onDone: (result) => {
            raceRankRef.current += 1;
            setResults((previous) => {
              const next = previous.map((item) =>
                item.model === model.id
                  ? {
                      ...item,
                      ...result,
                      status: 'done' as const,
                      latencyMs:
                        item.startedAtMs != null
                          ? Math.round(performance.now() - item.startedAtMs)
                          : result.latencyMs,
                      completionRank: raceRankRef.current,
                    }
                  : item
              );

              const readyCandidates = next.filter(
                (item) => item.status === 'done' && item.optimizedPrompt && !item.error
              );

              if (!judgeTriggeredRef.current && readyCandidates.length >= 2) {
                void triggerJudge(prompt, readyCandidates, 'initial');
              }

              return next;
            });
          },
          onError: () => {
            setResults((previous) =>
              previous.map((item) =>
                item.model === model.id
                  ? {
                      ...item,
                      status: 'error',
                      optimizedPrompt: '',
                      error: '本轮未完成',
                    }
                  : item
              )
            );
          },
        })
      )
    );

    const validCandidates = settled
      .flatMap((item) => (item.status === 'fulfilled' ? [item.value] : []))
      .filter((item) => item.optimizedPrompt && !item.error);

    setResults((previous) => previous.filter((item) => item.status !== 'error' || item.optimizedPrompt));

    if (validCandidates.length === 0) {
      setError('本轮没有拿到可用候选，请重试。');
      setPhase('done');
      return;
    }

    if (!judgeTriggeredRef.current && validCandidates.length >= 2) {
      void triggerJudge(prompt, validCandidates, 'initial');
    } else if (validCandidates.length > synthesizedCandidateCountRef.current) {
      void triggerJudge(prompt, validCandidates, 'refresh');
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
    setOptimizeSeconds(0);
    setJudgeSeconds(0);
    setSynthesisStatus('idle');
    startedAtRef.current = null;
    judgeStartedAtRef.current = null;
    judgeTriggeredRef.current = false;
    synthesizedCandidateCountRef.current = 0;
    setPhase('idle');
  };

  const triggerJudge = async (
    prompt: string,
    candidates: OptimizedResult[],
    mode: 'initial' | 'refresh'
  ) => {
    if (candidates.length === 0) return;
    if (mode === 'initial' && judgeTriggeredRef.current) return;

    if (!judgeTriggeredRef.current) {
      judgeTriggeredRef.current = true;
      if (startedAtRef.current) {
        setOptimizeSeconds((performance.now() - startedAtRef.current) / 1000);
        startedAtRef.current = null;
      }
      setPhase('judging');
      setSynthesisStatus('running');
      setJudgeSeconds(0);
      judgeStartedAtRef.current = performance.now();
    }

    try {
      const proofRes = await fetch('/api/create-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: prompt,
          candidates,
        }),
      });
      const proofData = await parseJsonResponse<{ submissionProof?: string; error?: string }>(proofRes);

      if (!proofRes.ok || !proofData.submissionProof) {
        throw new Error(proofData.error || 'Failed to create proof');
      }

      const synthRes = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: prompt,
          candidates,
          config,
          submissionProof: proofData.submissionProof,
        }),
      });
      const synthData = await parseJsonResponse<JudgeResponse & { error?: string }>(synthRes);

      if (!synthRes.ok) {
        throw new Error(synthData.error || 'Failed to synthesize prompt');
      }

      setSynthesizedBestPrompt(synthData.synthesizedBestPrompt || '');
      setSynthesisRationale(synthData.synthesisRationale || '');
      setAppliedAdvantages(synthData.appliedAdvantages || []);
      synthesizedCandidateCountRef.current = Math.max(
        synthesizedCandidateCountRef.current,
        candidates.length
      );

      if (mode === 'initial') {
        if (judgeStartedAtRef.current) {
          setJudgeSeconds((performance.now() - judgeStartedAtRef.current) / 1000);
        }
        judgeStartedAtRef.current = null;
        setSynthesisStatus('done');
        setPhase('done');
      }

      void runPostAnalysis({
        prompt,
        candidates,
        config,
        submissionProof: proofData.submissionProof,
        setRankings,
        setJudgeSummary,
        setSynthesisRationale,
        setAppliedAdvantages,
      });
    } catch {
      if (mode === 'initial') {
        if (judgeStartedAtRef.current) {
          setJudgeSeconds((performance.now() - judgeStartedAtRef.current) / 1000);
        }
        judgeStartedAtRef.current = null;
        setSynthesisStatus('idle');
        setError('综合裁判暂时未完成，请稍后重试。');
        setPhase('done');
      }
    }
  };

  const handleFinalizeEarly = () => {
    const readyCandidates = results.filter(
      (item) => item.status === 'done' && item.optimizedPrompt && !item.error
    );

    if (readyCandidates.length >= 2) {
      void triggerJudge(originalPrompt, readyCandidates, 'initial');
    }
  };

  const bestRanking = rankings[0];
  const bestResult = bestRanking
    ? results.find((result) => result.model === bestRanking.model)
    : results.find((result) => result.completionRank === 1);

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

  const visibleResults = results.filter(
    (item) => item.status !== 'error' || item.optimizedPrompt
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--page-bg)] text-[var(--ink-strong)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_26%),linear-gradient(180deg,#0b0d12_0%,#0f1218_100%)]" />

      <div className="relative mx-auto max-w-[1560px] px-5 py-6 md:px-8 md:py-8">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-start justify-between gap-4 rounded-[28px] border border-[var(--line)] bg-[rgba(255,255,255,0.025)] px-6 py-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur"
        >
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-strong)]">
              BetterPrompt
            </p>
            <h1 className="mt-2 text-[54px] font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
              多模型提示词优化工作台
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              四路竞速生成，边写边出，最后由 Kimi 融合定稿。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyBest}
              disabled={!synthesizedBestPrompt && !bestResult?.optimizedPrompt}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[var(--ink-strong)] disabled:opacity-40"
            >
              <Copy className="size-4" />
              复制最佳版
            </button>
            <button
              onClick={handleExportMarkdown}
              disabled={visibleResults.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[var(--ink-strong)] disabled:opacity-40"
            >
              <Download className="size-4" />
              导出
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[var(--ink-strong)]"
            >
              <RotateCcw className="size-4" />
              重置
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[var(--ink-strong)]"
            >
              <Settings className="size-4" />
              设置
            </button>
          </div>
        </motion.header>

        {phase !== 'idle' ? (
          <section ref={statusRailRef} className="mt-6">
            <ProgressRail
              results={results}
              judgeStatus={synthesisStatus}
              optimizeSeconds={optimizeSeconds}
              judgeSeconds={judgeSeconds}
            />
          </section>
        ) : null}

        <section
          ref={workbenchRef}
          className={`mt-6 ${phase === 'idle' ? 'mx-auto max-w-[860px]' : 'grid gap-8 xl:grid-cols-[380px_minmax(0,1fr)] items-start'}`}
        >
          <aside className={phase === 'idle' ? '' : 'xl:sticky xl:top-8 xl:self-start'}>
            <div className="rounded-[30px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur">
              <PromptInput
                onSubmit={handleSubmit}
                isLoading={phase === 'optimizing' || phase === 'judging'}
                compact={phase !== 'idle'}
              />
            </div>
          </aside>

          {phase !== 'idle' ? (
            <div className="space-y-6">
              {error ? (
                <div className="rounded-[24px] border border-[rgba(180,58,38,0.22)] bg-[rgba(88,30,21,0.28)] px-5 py-4 text-sm leading-6 text-[rgb(244,171,157)]">
                  {error}
                </div>
              ) : null}

              {phase === 'optimizing' && results.filter((item) => item.status === 'done').length >= 2 ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleFinalizeEarly}
                    disabled={judgeTriggeredRef.current}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(214,185,139,0.24)] bg-[rgba(214,185,139,0.12)] px-4 py-2 text-sm text-[var(--accent-strong)] disabled:opacity-40"
                  >
                    用当前结果提前定稿
                  </button>
                </div>
              ) : null}

              <RankingList
                rankings={rankings}
                results={visibleResults}
                judgeSummary={judgeSummary}
                judgeStatus={synthesisStatus}
                synthesizedBestPrompt={synthesizedBestPrompt}
                synthesisRationale={synthesisRationale}
                appliedAdvantages={appliedAdvantages}
                nowMs={nowMs}
                judgeSeconds={judgeSeconds}
              />

            </div>
          ) : null}
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

async function runPostAnalysis({
  prompt,
  candidates,
  config,
  submissionProof,
  setRankings,
  setJudgeSummary,
  setSynthesisRationale,
  setAppliedAdvantages,
}: {
  prompt: string;
  candidates: OptimizedResult[];
  config: ApiConfig;
  submissionProof: string;
  setRankings: (value: JudgeResult[]) => void;
  setJudgeSummary: (value: string) => void;
  setSynthesisRationale: (value: string) => void;
  setAppliedAdvantages: (value: string[]) => void;
}) {
  try {
    const judgeRes = await fetch('/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalPrompt: prompt,
        candidates,
        config,
        submissionProof,
      }),
    });
    const judgeData = await parseJsonResponse<JudgeResponse & { error?: string }>(judgeRes);

    if (judgeRes.ok) {
      setRankings(judgeData.rankings || []);
      setJudgeSummary(judgeData.judgeSummary || '');
      setSynthesisRationale(judgeData.synthesisRationale || '');
      setAppliedAdvantages(judgeData.appliedAdvantages || []);
    }
  } catch {
    // Ignore background ranking failure.
  }
}

async function streamOptimizer({
  modelId,
  prompt,
  config,
  onDelta,
  onDone,
  onError,
}: {
  modelId: string;
  prompt: string;
  config: ApiConfig;
  onDelta: (delta: string) => void;
  onDone: (result: OptimizedResult) => void;
  onError: () => void;
}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  try {
    const response = await fetch('/api/optimize-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, config, modelId }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error('stream unavailable');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: OptimizedResult | null = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        const payload = safeJsonParse(line);
        if (!payload) continue;

        if (payload.type === 'delta' && typeof payload.delta === 'string') {
          onDelta(payload.delta);
        }

        if (payload.type === 'done' && payload.result) {
          finalResult = payload.result as OptimizedResult;
        }

        if (payload.type === 'error') {
          throw new Error('stream error');
        }
      }
    }

    if (!finalResult) {
      throw new Error('stream incomplete');
    }

    onDone(finalResult);
    return finalResult;
  } catch {
    try {
      const fallback = await fetch('/api/optimize-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, config, modelId }),
      });
      const payload = await parseJsonResponse<{ result?: OptimizedResult; error?: string }>(fallback);
      const result = payload.result;

      if (result?.optimizedPrompt) {
        onDone({
          ...result,
          status: 'done',
        });
        return result;
      }
    } catch {
      // Ignore and surface generic fallback below.
    }

    onError();
    throw new Error('stream failed');
  } finally {
    window.clearTimeout(timeout);
  }
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function parseJsonResponse<T>(response: Response) {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return { error: '本轮未返回可用结果' } as T;
  }
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
