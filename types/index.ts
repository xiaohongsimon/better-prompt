export type ModelType = 'claude' | 'gpt4' | 'gemini';

export interface OptimizedResult {
  model: ModelType;
  optimizedPrompt: string;
  rawResponse?: string;
  error?: string;
}

export interface JudgeResult {
  model: ModelType;
  score: number;
  reason: string;
  rank: number;
}

export interface OptimizeRequest {
  prompt: string;
}

export interface OptimizeResponse {
  results: OptimizedResult[];
}

export interface JudgeRequest {
  originalPrompt: string;
  candidates: Array<{
    model: ModelType;
    optimizedPrompt: string;
  }>;
}

export interface JudgeResponse {
  rankings: JudgeResult[];
}