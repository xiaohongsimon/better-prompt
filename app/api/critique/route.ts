import { NextRequest, NextResponse } from 'next/server';
import {
  buildCritiqueUserPrompt,
  parseCritiqueResponse,
  PROMPT_CRITIQUE_SYSTEM_PROMPT,
} from '@/lib/prompts/optimizer';
import { assertConfig, createClient, getEffectiveConfig } from '@/lib/server/bailian';
import { enforceOrigin, enforceRateLimit, getClientIp, validatePrompt } from '@/lib/server/security';
import type { ApiConfig } from '@/types';

export async function POST(request: NextRequest) {
  try {
    enforceOrigin(request);

    const { prompt, config } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    validatePrompt(prompt);
    enforceRateLimit(`critique:${getClientIp(request)}`);

    const effectiveConfig = getEffectiveConfig(config as Partial<ApiConfig>);
    assertConfig(effectiveConfig, 'judge');

    const client = createClient(effectiveConfig);
    const response = await client.chat.completions.create({
      model: effectiveConfig.judgeModel,
      temperature: 0.3,
      max_tokens: 1400,
      messages: [
        { role: 'system', content: PROMPT_CRITIQUE_SYSTEM_PROMPT },
        { role: 'user', content: buildCritiqueUserPrompt(prompt) },
      ],
    });

    const content = response.choices[0]?.message?.content || '';
    const normalized = parseCritiqueResponse(content);

    return NextResponse.json(normalized);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to critique prompt' },
      { status: 500 }
    );
  }
}
