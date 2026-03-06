import OpenAI from 'openai';
import {
  BAILIAN_BASE_URL,
  DEFAULT_JUDGE_MODEL,
  DEFAULT_OPTIMIZER_MODEL_IDS,
  MODEL_NAME_MAP,
  type ApiConfig,
} from '@/types';

export function getEffectiveConfig(input?: Partial<ApiConfig>): ApiConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const optimizerSystemPrompt = input?.optimizerSystemPrompt?.trim() || process.env.OPTIMIZER_SYSTEM_PROMPT?.trim() || '';
  const judgeSystemPrompt = input?.judgeSystemPrompt?.trim() || process.env.JUDGE_SYSTEM_PROMPT?.trim() || '';

  return {
    baseUrl: (isProduction ? '' : input?.baseUrl?.trim()) || process.env.BAILIAN_BASE_URL?.trim() || BAILIAN_BASE_URL,
    apiKey: (isProduction ? '' : input?.apiKey?.trim()) || process.env.BAILIAN_API_KEY?.trim() || '',
    optimizerModels: input?.optimizerModels?.length ? input.optimizerModels : DEFAULT_OPTIMIZER_MODEL_IDS,
    judgeModel: input?.judgeModel?.trim() || process.env.JUDGE_MODEL?.trim() || DEFAULT_JUDGE_MODEL,
    optimizerTemperature: Number(input?.optimizerTemperature ?? process.env.OPTIMIZER_TEMPERATURE ?? 0.7),
    optimizerMaxTokens: Number(input?.optimizerMaxTokens ?? process.env.OPTIMIZER_MAX_TOKENS ?? 2200),
    judgeTemperature: Number(input?.judgeTemperature ?? process.env.JUDGE_TEMPERATURE ?? 0.2),
    judgeMaxTokens: Number(input?.judgeMaxTokens ?? process.env.JUDGE_MAX_TOKENS ?? 2400),
    optimizerSystemPrompt,
    judgeSystemPrompt,
  };
}

export function assertConfig(config: ApiConfig, mode: 'optimizer' | 'judge') {
  if (!config.baseUrl || !config.apiKey) {
    throw new Error('缺少百炼兼容接口配置，请填写 Base URL 与 API Key，或在 Vercel 环境变量中配置。');
  }

  if (mode === 'optimizer' && config.optimizerModels.length === 0) {
    throw new Error('至少需要选择一个优化模型。');
  }

  if (mode === 'judge' && !config.judgeModel) {
    throw new Error('必须配置裁判模型。');
  }
}

export function createClient(config: ApiConfig) {
  return new OpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
  });
}

export function getModelMeta(modelId: string) {
  const model = MODEL_NAME_MAP.get(modelId);
  return {
    modelName: model?.name || modelId,
    provider: model?.provider || 'Unknown',
  };
}
