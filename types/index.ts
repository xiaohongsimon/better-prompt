// 可用模型列表
export const AVAILABLE_MODELS = [
  { id: 'qwen3.5-plus', name: 'Qwen3.5 Plus', provider: '百炼' },
  { id: 'qwen3-max-2026-01-23', name: 'Qwen3 Max', provider: '百炼' },
  { id: 'qwen3-coder-next', name: 'Qwen3 Coder Next', provider: '百炼' },
  { id: 'qwen3-coder-plus', name: 'Qwen3 Coder Plus', provider: '百炼' },
  { id: 'MiniMax-M2.5', name: 'MiniMax M2.5', provider: '百炼' },
  { id: 'glm-5', name: 'GLM-5', provider: '百炼' },
  { id: 'glm-4.7', name: 'GLM-4.7', provider: '百炼' },
  { id: 'kimi-k2.5', name: 'Kimi K2.5', provider: '百炼' },
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];

export interface OptimizedResult {
  model: string;
  modelName: string;
  optimizedPrompt: string;
  error?: string;
}

export interface JudgeResult {
  model: string;
  modelName: string;
  score: number;
  reason: string;
  rank: number;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  optimizerModels: string[];  // 用于优化的模型ID列表
  judgeModel: string;         // 用于评分的模型ID
}