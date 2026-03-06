'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AVAILABLE_MODELS,
  BAILIAN_BASE_URL,
  DEFAULT_JUDGE_MODEL,
  DEFAULT_OPTIMIZER_MODEL_IDS,
  type ApiConfig,
} from '@/types';
import {
  DEFAULT_JUDGE_SYSTEM_PROMPT,
  DEFAULT_OPTIMIZER_SYSTEM_PROMPT,
} from '@/lib/prompts/optimizer';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ApiConfig) => void;
  initialConfig: ApiConfig;
}

export function SettingsModal({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}: SettingsModalProps) {
  const [config, setConfig] = useState<ApiConfig>(initialConfig);
  const isProduction = process.env.NODE_ENV === 'production';

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  if (!isOpen) return null;

  const handleToggleModel = (modelId: string) => {
    const optimizerModels = config.optimizerModels.includes(modelId)
      ? config.optimizerModels.filter((id) => id !== modelId)
      : [...config.optimizerModels, modelId];

    setConfig({ ...config, optimizerModels });
  };

  const applyBailianPreset = () => {
    setConfig({
      ...config,
      baseUrl: BAILIAN_BASE_URL,
      optimizerModels: DEFAULT_OPTIMIZER_MODEL_IDS,
      judgeModel: DEFAULT_JUDGE_MODEL,
      optimizerTemperature: 0.7,
      optimizerMaxTokens: 2200,
      judgeTemperature: 0.2,
      judgeMaxTokens: 2400,
      optimizerSystemPrompt: DEFAULT_OPTIMIZER_SYSTEM_PROMPT,
      judgeSystemPrompt: DEFAULT_JUDGE_SYSTEM_PROMPT,
    });
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const canSave = config.optimizerModels.length > 0 && Boolean(config.judgeModel);

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(15,23,42,0.45)] p-4 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center">
        <Card className="max-h-[92vh] w-full overflow-y-auto rounded-[32px] border-white/70 bg-[rgba(250,247,242,0.95)] shadow-[0_40px_120px_rgba(28,37,56,0.28)]">
          <CardHeader className="border-b border-black/5 pb-5">
            <CardTitle className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                  Settings
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink-strong)]">
                  百炼 Coding Plan 配置
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyBailianPreset}
                  className="rounded-full border-[var(--line)] bg-white/80"
                >
                  <RotateCcw className="mr-2 size-4" />
                  套用百炼预设
                </Button>
                <button
                  onClick={onClose}
                  className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-sm text-[var(--ink-soft)]"
                >
                  关闭
                </button>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8 p-6">
            {isProduction ? (
              <section className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-soft)] p-5 text-sm leading-6 text-[var(--ink-soft)]">
                线上模式已隐藏浏览器侧 Base URL 与 API Key 输入，真实百炼凭证只从 Vercel 环境变量读取。
              </section>
            ) : (
              <section className="grid gap-6 md:grid-cols-2">
                <Field label="Base URL" hint="百炼 OpenAI 兼容接口地址">
                  <input
                    type="text"
                    value={config.baseUrl}
                    placeholder={BAILIAN_BASE_URL}
                    onChange={(event) => setConfig({ ...config, baseUrl: event.target.value })}
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
                  />
                </Field>

                <Field label="API Key" hint="开发模式下可走浏览器本地配置">
                  <input
                    type="password"
                    value={config.apiKey}
                    placeholder="sk-..."
                    onChange={(event) => setConfig({ ...config, apiKey: event.target.value })}
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
                  />
                </Field>
              </section>
            )}

            <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[28px] border border-[var(--line)] bg-white/80 p-5">
                <p className="text-sm font-semibold text-[var(--ink-strong)]">优化模型</p>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  默认就是你提到的四个模型，支持自由增删。
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {AVAILABLE_MODELS.map((model) => (
                    <label
                      key={model.id}
                      className={`rounded-2xl border px-4 py-3 transition ${
                        config.optimizerModels.includes(model.id)
                          ? 'border-[var(--accent)] bg-[rgba(202,97,44,0.08)]'
                          : 'border-[var(--line)] bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={config.optimizerModels.includes(model.id)}
                          onChange={() => handleToggleModel(model.id)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-[var(--ink-strong)]">{model.name}</div>
                          <div className="text-xs text-[var(--ink-soft)]">
                            {model.provider} · {model.id}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-6 rounded-[28px] border border-[var(--line)] bg-white/80 p-5">
                <Field label="裁判模型" hint="建议单独使用一个模型做评分">
                  <select
                    value={config.judgeModel}
                    onChange={(event) => setConfig({ ...config, judgeModel: event.target.value })}
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
                  >
                    <option value="">请选择模型</option>
                    {AVAILABLE_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} · {model.id}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid gap-4">
                  <Field label="优化 Temperature" hint="建议 0.6 - 0.8">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={config.optimizerTemperature}
                      onChange={(event) =>
                        setConfig({ ...config, optimizerTemperature: Number(event.target.value) })
                      }
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
                    />
                  </Field>
                  <Field label="优化 Max Tokens" hint="确保优化后提示词和结构化结果能完整输出">
                    <input
                      type="number"
                      min="512"
                      value={config.optimizerMaxTokens}
                      onChange={(event) =>
                        setConfig({ ...config, optimizerMaxTokens: Number(event.target.value) })
                      }
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
                    />
                  </Field>
                  <Field label="裁判 Temperature" hint="建议较低，减少排序波动">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={config.judgeTemperature}
                      onChange={(event) =>
                        setConfig({ ...config, judgeTemperature: Number(event.target.value) })
                      }
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
                    />
                  </Field>
                  <Field label="裁判 Max Tokens" hint="用于输出完整点评和维度分数">
                    <input
                      type="number"
                      min="512"
                      value={config.judgeMaxTokens}
                      onChange={(event) =>
                        setConfig({ ...config, judgeMaxTokens: Number(event.target.value) })
                      }
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
                    />
                  </Field>
                </div>
              </div>
            </section>

            <section className="grid gap-6">
              <Field label="优化模型系统提示词" hint="发给四个优化模型的统一系统提示词">
                <textarea
                  value={config.optimizerSystemPrompt}
                  onChange={(event) =>
                    setConfig({ ...config, optimizerSystemPrompt: event.target.value })
                  }
                  className="min-h-[220px] w-full rounded-[24px] border border-[var(--line)] bg-white px-4 py-4 text-sm leading-6"
                />
              </Field>

              <Field label="裁判系统提示词" hint="发给评审模型的系统提示词">
                <textarea
                  value={config.judgeSystemPrompt}
                  onChange={(event) =>
                    setConfig({ ...config, judgeSystemPrompt: event.target.value })
                  }
                  className="min-h-[260px] w-full rounded-[24px] border border-[var(--line)] bg-white px-4 py-4 text-sm leading-6"
                />
              </Field>
            </section>

            <div className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm leading-6 text-[var(--ink-soft)]">
              <span>说明：为了适配 Vercel，服务端也支持环境变量。若设置面板未填写，会自动回退到 </span>
              <code>BAILIAN_BASE_URL</code>
              <span>、</span>
              <code>BAILIAN_API_KEY</code>
              <span>、</span>
              <code>OPTIMIZER_*</code>
              <span>、</span>
              <code>JUDGE_*</code>
              <span>。</span>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-full border-[var(--line)] bg-white/80"
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={!canSave}
                className="flex-1 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]"
              >
                保存配置
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <div>
        <div className="text-sm font-semibold text-[var(--ink-strong)]">{label}</div>
        <div className="text-xs text-[var(--ink-soft)]">{hint}</div>
      </div>
      {children}
    </label>
  );
}
