import type {
  CritiquePayload,
  JudgePromptPayload,
  OptimizedResult,
  OptimizerPromptPayload,
} from '@/types';

export const DEFAULT_OPTIMIZER_SYSTEM_PROMPT = `你是一名世界级 Prompt Engineer，专门为高阶大模型任务编写可执行、可控、可复用的专业提示词。你的职责不是润色，而是把用户的原始需求提升成一条真正顶尖的提示词。

核心目标：
- 保留用户真实意图，不擅自改题。
- 大幅提升任务定义、约束设计、输出稳定性和专业度。
- 让提示词更容易得到高质量、结构清晰、风格一致的结果。

你必须兼顾以下维度：
1. 任务定义是否清晰，避免歧义。
2. 上下文是否充分，补足必要背景与边界。
3. 约束是否可执行，避免空泛表述。
4. 输出格式是否明确，便于模型稳定产出。
5. 专业程度是否足够，体现任务拆解、质量标准、失败兜底。

工作要求：
- 如果原提示词过短，要补足合理结构，但不要编造具体事实。
- 输出必须适用于通用大模型，避免依赖特定平台私有语法。
- 优先让提示词更“可执行、可控制、可复用、可交付”。
- 默认使用中文输出；只有当原始提示词明确要求英文或其他语言时，才切换对应语言。
- 如果用户没有明确要求输出形式，请主动补齐结构、步骤、边界条件、质量标准和输出格式。
- 如果任务复杂，请把提示词整理成清晰的分段结构，而不是一段松散自然语言。
- 不要写“你可以”“尽量”等松软措辞，尽可能使用明确可执行的指令。
- 不要解释你的思考过程，不要输出多余寒暄。

严格按以下 JSON 输出，不要加 Markdown 代码块：
{
  "optimized_prompt": "优化后的完整提示词",
  "strategy_summary": "一句话概括本次优化策略",
  "key_upgrades": ["升级点1", "升级点2", "升级点3"],
  "applicable_scenarios": ["适用场景1", "适用场景2"]
}`;

export const DEFAULT_JUDGE_SYSTEM_PROMPT = `你是一名世界级 Prompt Review Judge，负责对多份“优化后的提示词”进行专业评分、排序，并融合出一版最佳综合稿。你的判断标准必须严格、专业、可解释。

评分目标：
- 找出哪份提示词最清晰、最专业、最可执行、最利于获得高质量输出。
- 点评必须具体，不能只写空泛赞美或套话。
- 排名应体现相对差异，避免所有候选分数过于接近。
- 在完成排序后，必须融合四份候选中最值得保留的部分，输出一版 synthesized_best_prompt。
- synthesized_best_prompt 默认使用中文输出；只有当原始提示词明确要求英文或其他语言时，才切换对应语言。

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
- synthesized_best_prompt 必须是一版可以直接复制使用的最终提示词，而不是分析说明。
- synthesis_rationale 需要解释你综合吸收了哪些优点。
- 如果四份候选中有明显优秀片段，必须在综合稿中吸收，而不是机械平均。
- 综合稿必须是一版可以直接复制使用的高水平最终稿，不要变成点评摘要。

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
  "overall_summary": "对本轮候选整体质量的总结",
  "synthesized_best_prompt": "融合四份候选优势后的最终提示词",
  "synthesis_rationale": "为什么这样融合",
  "applied_advantages": ["吸收点1", "吸收点2", "吸收点3"]
}`;

export const PROMPT_CRITIQUE_SYSTEM_PROMPT = `你是一名顶级 Prompt Coach，负责专业点评“用户原始提示词”的质量，帮助普通用户逐步学会写出更清晰、更专业、更可执行的提示词。

你的任务不是批评用户，而是用用户看得懂的中文指出：
- 这条提示词已经做对了什么
- 它还缺什么
- 为什么这些缺失会影响模型输出
- 用户下次应该优先改哪几件事

要求：
- 默认使用中文输出。
- 语言必须专业但易懂，不能故作高深。
- 点评必须具体，不能只说“更清晰一点”“更具体一点”。
- quick_fix_example 必须给出一版简短的就地修正示例，让用户一眼看懂怎么改。
- 不要输出思维链，不要输出寒暄。

严格按以下 JSON 输出，不要加 Markdown 代码块：
{
  "overall_assessment": "一句话总体评价",
  "score": 72,
  "strengths": ["优点1", "优点2"],
  "issues": ["问题1", "问题2", "问题3"],
  "rewrite_principles": ["建议1", "建议2", "建议3"],
  "quick_fix_example": "一版简短的示例改写"
}`;

export const DEFAULT_SYNTHESIZER_SYSTEM_PROMPT = `你是一名世界级 Prompt Synthesizer。你的唯一任务，是从多份“优化后的提示词候选”中尽快融合出一版可直接复制使用的最佳最终稿。

要求：
- 你的第一优先级是产出 synthesized_best_prompt，而不是评分。
- 必须优先保留最有价值的结构、约束、角色设定、输入要求、输出格式和质量标准。
- 不要机械拼接，要融合成一版自然、完整、专业、可执行的最终提示词。
- 默认使用中文输出；只有当原始提示词明确要求英文或其他语言时，才切换对应语言。
- synthesis_rationale 只用简洁说明为什么这样融合。
- applied_advantages 用简短短语列出吸收的优点。

严格按以下 JSON 输出，不要加 Markdown 代码块：
{
  "synthesized_best_prompt": "融合后的最终提示词",
  "synthesis_rationale": "为什么这样融合",
  "applied_advantages": ["吸收点1", "吸收点2", "吸收点3"]
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

请严格输出 JSON，并完成评分排序与综合最佳稿输出。`;
}

export function buildCritiqueUserPrompt(originalPrompt: string) {
  return `请点评下面这条“用户原始提示词”。

原始提示词：
"""
${originalPrompt}
"""

请站在 Prompt Coach 的角度，输出用户可以直接理解和学习的结构化点评。`;
}

export function buildSynthesizerUserPrompt(
  originalPrompt: string,
  candidates: OptimizedResult[]
) {
  const candidateText = candidates
    .map((candidate, index) => {
      return [
        `候选 ${index + 1}`,
        `model: ${candidate.model}`,
        `provider: ${candidate.provider}`,
        `optimized_prompt:`,
        candidate.optimizedPrompt,
      ].join('\n');
    })
    .join('\n\n');

  return `请只做一件事：尽快融合出最佳最终稿。

原始提示词：
"""
${originalPrompt}
"""

候选列表：
${candidateText}

请严格输出 JSON。`;
}

export function extractJsonObject(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  const extracted = extractBalancedJson(candidate);

  if (!extracted) {
    throw new Error('Model response did not contain a JSON object');
  }

  return parseJsonWithRepair(extracted);
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
    synthesizedBestPrompt: payload.synthesized_best_prompt ?? '',
    synthesisRationale: payload.synthesis_rationale ?? '',
    appliedAdvantages: payload.applied_advantages ?? [],
  };
}

export function normalizeCritiquePayload(payload: CritiquePayload) {
  return {
    overallAssessment: payload.overall_assessment ?? '',
    score: payload.score ?? 0,
    strengths: payload.strengths ?? [],
    issues: payload.issues ?? [],
    rewritePrinciples: payload.rewrite_principles ?? [],
    quickFixExample: payload.quick_fix_example ?? '',
  };
}

export function parseJudgeResponse(text: string) {
  try {
    const parsed = extractJsonObject(text) as Partial<JudgePromptPayload>;

    return normalizeJudgePayload({
      ranking: Array.isArray(parsed.ranking) ? parsed.ranking : [],
      overall_summary: parsed.overall_summary ?? '',
      synthesized_best_prompt: parsed.synthesized_best_prompt ?? '',
      synthesis_rationale: parsed.synthesis_rationale ?? '',
      applied_advantages: Array.isArray(parsed.applied_advantages)
        ? parsed.applied_advantages
        : [],
    } as JudgePromptPayload);
  } catch {
    const fallback = text.trim();

    return {
      ranking: [],
      overallSummary: fallback || '裁判未返回结构化排序结果。',
      synthesizedBestPrompt: '',
      synthesisRationale: '',
      appliedAdvantages: [],
    };
  }
}

export function parseCritiqueResponse(text: string) {
  try {
    const parsed = extractJsonObject(text) as Partial<CritiquePayload>;

    return normalizeCritiquePayload({
      overall_assessment: parsed.overall_assessment ?? '',
      score: typeof parsed.score === 'number' ? parsed.score : 0,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      rewrite_principles: Array.isArray(parsed.rewrite_principles)
        ? parsed.rewrite_principles
        : [],
      quick_fix_example: parsed.quick_fix_example ?? '',
    } as CritiquePayload);
  } catch {
    const fallback = text.trim();

    return normalizeCritiquePayload({
      overall_assessment: fallback || '点评结果未按结构化格式返回。',
      score: 0,
      strengths: [],
      issues: [],
      rewrite_principles: [],
      quick_fix_example: '',
    });
  }
}

function extractBalancedJson(text: string) {
  const start = text.indexOf('{');
  if (start === -1) return '';

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;

    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }

  return text.slice(start);
}

function parseJsonWithRepair(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    const repaired = repairJsonString(input);

    return JSON.parse(repaired);
  }
}

function repairJsonString(input: string) {
  const base = input
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1');

  let result = '';
  let inString = false;
  let escaped = false;
  let braceCount = 0;
  let bracketCount = 0;

  for (const char of base) {
    if (inString) {
      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        result += char;
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
        result += char;
        continue;
      }

      if (char === '\n' || char === '\r') {
        result += '\\n';
        continue;
      }

      result += char;
      continue;
    }

    if (char === '"') {
      inString = true;
      result += char;
      continue;
    }

    if (char === '{') braceCount += 1;
    if (char === '}') braceCount -= 1;
    if (char === '[') bracketCount += 1;
    if (char === ']') bracketCount -= 1;

    result += char;
  }

  if (inString) {
    result += '"';
  }

  if (bracketCount > 0) {
    result += ']'.repeat(bracketCount);
  }

  if (braceCount > 0) {
    result += '}'.repeat(braceCount);
  }

  return result.replace(/[\u0000-\u0019]+/g, ' ');
}
