export const AVAILABLE_MODELS = [
  { id: 'qwen3.5-plus', name: 'Qwen 3.5', provider: 'Qwen', role: 'optimizer' },
  { id: 'glm-5', name: 'GLM-5', provider: 'Zhipu', role: 'optimizer' },
  { id: 'kimi-k2.5', name: 'Kimi 2.5', provider: 'Moonshot', role: 'optimizer' },
  { id: 'MiniMax-M2.5', name: 'MiniMax 2.5', provider: 'MiniMax', role: 'optimizer' },
  { id: 'qwen3-max-2026-01-23', name: 'Qwen 3 Max', provider: 'Qwen', role: 'judge' },
  { id: 'glm-4.7', name: 'GLM-4.7', provider: 'Zhipu', role: 'judge' },
  { id: 'qwen3-coder-next', name: 'Qwen 3 Coder Next', provider: 'Qwen', role: 'general' },
  { id: 'qwen3-coder-plus', name: 'Qwen 3 Coder Plus', provider: 'Qwen', role: 'general' },
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];

export interface OptimizerPromptPayload {
  optimized_prompt: string;
  strategy_summary: string;
  key_upgrades: string[];
  applicable_scenarios: string[];
}

export interface JudgePromptPayload {
  ranking: Array<{
    model: string;
    total_score: number;
    verdict: string;
    strengths: string[];
    weaknesses: string[];
    improvement_focus: string[];
    dimension_scores: {
      clarity: number;
      completeness: number;
      controllability: number;
      professionality: number;
      execution_likelihood: number;
    };
  }>;
  overall_summary: string;
  synthesized_best_prompt: string;
  synthesis_rationale: string;
  applied_advantages: string[];
}

export interface OptimizedResult {
  model: string;
  modelName: string;
  provider: string;
  optimizedPrompt: string;
  strategySummary: string;
  keyUpgrades: string[];
  applicableScenarios: string[];
  rawText?: string;
  error?: string;
}

export interface JudgeResult {
  model: string;
  modelName: string;
  provider: string;
  score: number;
  rank: number;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  improvementFocus: string[];
  dimensionScores: {
    clarity: number;
    completeness: number;
    controllability: number;
    professionality: number;
    executionLikelihood: number;
  };
}

export interface AppState {
  originalPrompt: string;
  results: OptimizedResult[];
  rankings: JudgeResult[];
  judgeSummary: string;
}

export interface OptimizeResponse {
  results: OptimizedResult[];
  submissionProof: string;
}

export interface JudgeResponse {
  rankings: JudgeResult[];
  judgeSummary: string;
  synthesizedBestPrompt: string;
  synthesisRationale: string;
  appliedAdvantages: string[];
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  optimizerModels: string[];
  judgeModel: string;
  optimizerTemperature: number;
  optimizerMaxTokens: number;
  judgeTemperature: number;
  judgeMaxTokens: number;
  optimizerSystemPrompt: string;
  judgeSystemPrompt: string;
}

export const BAILIAN_BASE_URL = 'https://coding.dashscope.aliyuncs.com/v1';

export const DEFAULT_OPTIMIZER_MODEL_IDS: string[] = [
  'qwen3.5-plus',
  'glm-5',
  'kimi-k2.5',
  'MiniMax-M2.5',
];

export const DEFAULT_JUDGE_MODEL = 'kimi-k2.5';

export const MODEL_NAME_MAP: ReadonlyMap<string, (typeof AVAILABLE_MODELS)[number]> = new Map(
  AVAILABLE_MODELS.map((model) => [model.id, model])
);
