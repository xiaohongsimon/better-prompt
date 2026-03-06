import type { JudgePromptPayload, OptimizedResult, OptimizerPromptPayload } from '@/types';

export const DEFAULT_OPTIMIZER_SYSTEM_PROMPT = `你是一名资深 Prompt Engineer，负责把用户的原始提示词重写成更适合大模型执行的专业版本。

你的目标不是简单润色，而是系统提升提示词的执行质量。你必须兼顾以下维度：
1. 任务定义是否清晰，避免歧义。
2. 上下文是否充分，补足必要背景与边界。
3. 约束是否可执行，避免空泛表述。
4. 输出格式是否明确，便于模型稳定产出。
5. 专业程度是否足够，体现任务拆解、质量标准、失败兜底。

工作要求：
- 保留用户真实意图，不要擅自改题。
- 如果原提示词过短，要补足合理结构，但不要编造具体事实。
- 输出必须适用于通用大模型，避免依赖特定平台私有语法。
- 优先让提示词更“可执行、可控制、可复用”。
- 不要解释你的思考过程，不要输出多余寒暄。

严格按以下 JSON 输出，不要加 Markdown 代码块：
{
  "optimized_prompt": "优化后的完整提示词",
  "strategy_summary": "一句话概括本次优化策略",
  "key_upgrades": ["升级点1", "升级点2", "升级点3"],
  "applicable_scenarios": ["适用场景1", "适用场景2"]
}`;

export const DEFAULT_JUDGE_SYSTEM_PROMPT = `你是一名严谨的 Prompt Review Judge，负责对多份“优化后的提示词”进行专业评分、排序，并给出精准点评。

评分目标：
- 找出哪份提示词最清晰、最专业、最可执行、最利于获得高质量输出。
- 点评必须具体，不能只写空泛赞美或套话。
- 排名应体现相对差异，避免所有候选分数过于接近。

评分维度：
1. clarity：任务表达是否清楚，是否减少歧义。
2. completeness：上下文、约束、输入输出要求是否完整。
3. controllability：是否便于控制风格、结构、步骤、边界条件。
4. professionality：是否体现专业提示词设计能力。
5. execution_likelihood：是否更可能稳定产出高质量结果。

裁判要求：
- 必须先理解原始提示词意图，再评估候选版本是否忠实且升级充分。
- 不能偏袒任何模型品牌，只按文本质量评判。
- 点评要指出“为什么高分”和“为什么没拿第一”。
- 总分使用 0-100 整数。
- 所有候选都必须进入 ranking 数组，并按 total_score 从高到低排序。

严格按以下 JSON 输出，不要加 Markdown 代码块：
{
  "ranking": [
    {
      "model": "模型ID",
      "total_score": 92,
      "verdict": "一句话结论",
      "strengths": ["优点1", "优点2"],
      "weaknesses": ["不足1", "不足2"],
      "improvement_focus": ["改进建议1", "改进建议2"],
      "dimension_scores": {
        "clarity": 19,
        "completeness": 18,
        "controllability": 19,
        "professionality": 18,
        "execution_likelihood": 18
      }
    }
  ],
  "overall_summary": "对本轮候选整体质量的总结"
}`;

export function buildOptimizerUserPrompt(originalPrompt: string) {
  return `请优化下面这条原始提示词。

原始提示词：
"""
${originalPrompt}
"""

请在不改变核心任务目标的前提下，将其改写为更专业、更稳定、更易出好结果的版本，并按要求输出 JSON。`;
}

export function buildJudgeUserPrompt(
  originalPrompt: string,
  candidates: OptimizedResult[]
) {
  const candidateText = candidates
    .map((candidate, index) => {
      return [
        `候选 ${index + 1}`,
        `model: ${candidate.model}`,
        `provider: ${candidate.provider}`,
        `strategy_summary: ${candidate.strategySummary}`,
        `optimized_prompt:`,
        candidate.optimizedPrompt,
      ].join('\n');
    })
    .join('\n\n');

  return `请评审以下候选优化提示词。

原始提示词：
"""
${originalPrompt}
"""

候选列表：
${candidateText}

请严格输出 JSON，并完成评分排序。`;
}

export function extractJsonObject(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const match = candidate.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error('Model response did not contain a JSON object');
  }

  return JSON.parse(match[0]);
}

export function parseOptimizerResponse(text: string): OptimizerPromptPayload {
  try {
    const parsed = extractJsonObject(text) as Partial<OptimizerPromptPayload>;
    const optimizedPrompt = parsed.optimized_prompt?.trim();

    if (optimizedPrompt) {
      return {
        optimized_prompt: optimizedPrompt,
        strategy_summary: parsed.strategy_summary?.trim() || '模型按结构化要求返回了优化结果。',
        key_upgrades: parsed.key_upgrades?.filter(Boolean).slice(0, 5) || [],
        applicable_scenarios: parsed.applicable_scenarios?.filter(Boolean).slice(0, 4) || [],
      };
    }
  } catch {
    // Fall back to raw text parsing below.
  }

  const fallback = text.trim();
  if (!fallback) {
    throw new Error('Model response was empty');
  }

  return {
    optimized_prompt: fallback,
    strategy_summary: '模型未按 JSON 返回，系统已自动回退为纯文本候选。',
    key_upgrades: ['已保留模型原始优化文本'],
    applicable_scenarios: ['需要人工复核格式的场景'],
  };
}

export function normalizeJudgePayload(payload: JudgePromptPayload) {
  return {
    ranking: payload.ranking ?? [],
    overallSummary: payload.overall_summary ?? '',
  };
}
