import { NextRequest, NextResponse } from 'next/server';
import {
  buildOptimizerUserPrompt,
  DEFAULT_OPTIMIZER_SYSTEM_PROMPT,
  parseOptimizerResponse,
} from '@/lib/prompts/optimizer';
import { assertConfig, createClient, getEffectiveConfig, getModelMeta } from '@/lib/server/bailian';
import {
  enforceOrigin,
  enforceRateLimit,
  getClientIp,
  validatePrompt,
  verifyTurnstileToken,
} from '@/lib/server/security';
import type { ApiConfig, OptimizedResult } from '@/types';

export async function POST(request: NextRequest) {
  let modelId = '';

  try {
    enforceOrigin(request);

    const payload = await request.json();
    const { prompt, config, modelId: requestedModelId, turnstileToken } = payload;
    modelId = requestedModelId;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!modelId || typeof modelId !== 'string') {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }

    validatePrompt(prompt);
    enforceRateLimit(`optimize:${getClientIp(request)}`);
    await verifyTurnstileToken(turnstileToken, request);

    const effectiveConfig = getEffectiveConfig(config as Partial<ApiConfig>);
    effectiveConfig.optimizerSystemPrompt ||= DEFAULT_OPTIMIZER_SYSTEM_PROMPT;
    effectiveConfig.optimizerModels = [modelId];
    assertConfig(effectiveConfig, 'optimizer');

    const client = createClient(effectiveConfig);
    const meta = getModelMeta(modelId);
    const response = await client.chat.completions.create({
      model: modelId,
      temperature: effectiveConfig.optimizerTemperature,
      max_tokens: effectiveConfig.optimizerMaxTokens,
      messages: [
        { role: 'system', content: effectiveConfig.optimizerSystemPrompt },
        { role: 'user', content: buildOptimizerUserPrompt(prompt) },
      ],
    });

    const content = response.choices[0]?.message?.content || '';
    const parsed = parseOptimizerResponse(content);

    const result: OptimizedResult = {
      model: modelId,
      modelName: meta.modelName,
      provider: meta.provider,
      optimizedPrompt: parsed.optimized_prompt?.trim() || '',
      strategySummary: parsed.strategy_summary?.trim() || '',
      keyUpgrades: parsed.key_upgrades?.slice(0, 5) || [],
      applicableScenarios: parsed.applicable_scenarios?.slice(0, 4) || [],
      rawText: content,
    };

    return NextResponse.json({ result });
  } catch (error) {
    const meta = getModelMeta(modelId);

    return NextResponse.json({
      result: {
        model: modelId,
        modelName: meta.modelName,
        provider: meta.provider,
        optimizedPrompt: '',
        strategySummary: '',
        keyUpgrades: [],
        applicableScenarios: [],
        error: error instanceof Error ? error.message : 'Failed to optimize prompt',
      } satisfies OptimizedResult,
    });
  }
}
