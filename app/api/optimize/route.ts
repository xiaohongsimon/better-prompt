import { NextRequest, NextResponse } from 'next/server';
import {
  buildOptimizerUserPrompt,
  DEFAULT_OPTIMIZER_SYSTEM_PROMPT,
  extractJsonObject,
} from '@/lib/prompts/optimizer';
import { assertConfig, createClient, getEffectiveConfig, getModelMeta } from '@/lib/server/bailian';
import {
  createSubmissionProof,
  enforceOrigin,
  enforceRateLimit,
  getClientIp,
  validatePrompt,
  verifyTurnstileToken,
} from '@/lib/server/security';
import type { ApiConfig, OptimizedResult, OptimizerPromptPayload } from '@/types';

export async function POST(request: NextRequest) {
  try {
    enforceOrigin(request);

    const { prompt, config, turnstileToken } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    validatePrompt(prompt);
    enforceRateLimit(`optimize:${getClientIp(request)}`);
    await verifyTurnstileToken(turnstileToken, request);

    const effectiveConfig = getEffectiveConfig(config as Partial<ApiConfig>);
    effectiveConfig.optimizerSystemPrompt ||= DEFAULT_OPTIMIZER_SYSTEM_PROMPT;
    assertConfig(effectiveConfig, 'optimizer');

    const client = createClient(effectiveConfig);
    const userPrompt = buildOptimizerUserPrompt(prompt);

    const results = await Promise.all(
      effectiveConfig.optimizerModels.map(async (modelId) => {
        const meta = getModelMeta(modelId);

        try {
          const response = await client.chat.completions.create({
            model: modelId,
            temperature: effectiveConfig.optimizerTemperature,
            max_tokens: effectiveConfig.optimizerMaxTokens,
            messages: [
              { role: 'system', content: effectiveConfig.optimizerSystemPrompt },
              { role: 'user', content: userPrompt },
            ],
          });

          const content = response.choices[0]?.message?.content || '';
          const parsed = extractJsonObject(content) as OptimizerPromptPayload;

          return {
            model: modelId,
            modelName: meta.modelName,
            provider: meta.provider,
            optimizedPrompt: parsed.optimized_prompt?.trim() || '',
            strategySummary: parsed.strategy_summary?.trim() || '',
            keyUpgrades: parsed.key_upgrades?.slice(0, 5) || [],
            applicableScenarios: parsed.applicable_scenarios?.slice(0, 4) || [],
            rawText: content,
          } satisfies OptimizedResult;
        } catch (error) {
          return {
            model: modelId,
            modelName: meta.modelName,
            provider: meta.provider,
            optimizedPrompt: '',
            strategySummary: '',
            keyUpgrades: [],
            applicableScenarios: [],
            error: error instanceof Error ? error.message : 'Failed to optimize prompt',
          } satisfies OptimizedResult;
        }
      })
    );

    return NextResponse.json({
      results,
      submissionProof: createSubmissionProof(prompt, results.filter((item) => !item.error)),
    });
  } catch (error) {
    console.error('Optimize API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to optimize prompt',
      },
      { status: 500 }
    );
  }
}
