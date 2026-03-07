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
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const send = (payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        };

        let fullText = '';

        try {
          let streamed = false;

          try {
            const response = await client.chat.completions.create({
              model: modelId,
              temperature: effectiveConfig.optimizerTemperature,
              max_tokens: effectiveConfig.optimizerMaxTokens,
              stream: true,
              messages: [
                { role: 'system', content: effectiveConfig.optimizerSystemPrompt },
                { role: 'user', content: buildOptimizerUserPrompt(prompt) },
              ],
            });

            for await (const chunk of response as AsyncIterable<unknown>) {
              const delta = extractDeltaContent(chunk);

              if (!delta) continue;
              streamed = true;
              fullText += delta;
              send({ type: 'delta', delta });
            }
          } catch {
            streamed = false;
          }

          if (!streamed || !fullText.trim()) {
            const fallback = await client.chat.completions.create({
              model: modelId,
              temperature: effectiveConfig.optimizerTemperature,
              max_tokens: effectiveConfig.optimizerMaxTokens,
              messages: [
                { role: 'system', content: effectiveConfig.optimizerSystemPrompt },
                { role: 'user', content: buildOptimizerUserPrompt(prompt) },
              ],
            });

            fullText = fallback.choices[0]?.message?.content || '';
            if (fullText) {
              send({ type: 'delta', delta: fullText });
            }
          }

          const parsed = parseOptimizerResponse(fullText);
          const result: OptimizedResult = {
            model: modelId,
            modelName: meta.modelName,
            provider: meta.provider,
            optimizedPrompt: parsed.optimized_prompt?.trim() || '',
            strategySummary: parsed.strategy_summary?.trim() || '',
            keyUpgrades: parsed.key_upgrades?.slice(0, 5) || [],
            applicableScenarios: parsed.applicable_scenarios?.slice(0, 4) || [],
            rawText: fullText,
          };

          send({ type: 'done', result });
        } catch (error) {
          send({ type: 'error', error: toUserFriendlyError(error) });
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
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
        error: toUserFriendlyError(error),
      } satisfies OptimizedResult,
    });
  }
}

function extractDeltaContent(chunk: unknown) {
  const content = readPath(chunk, ['choices', 0, 'delta', 'content']);

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item?.text === 'string' ? item.text : ''))
      .join('');
  }

  return '';
}

function readPath(source: unknown, path: Array<string | number>): unknown {
  let current = source;

  for (const key of path) {
    if (typeof key === 'number') {
      if (!Array.isArray(current)) return undefined;
      current = current[key];
      continue;
    }

    if (!current || typeof current !== 'object' || !(key in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

function toUserFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Failed to optimize prompt';

  if (
    message.includes('Unexpected token') ||
    message.includes('is not valid JSON') ||
    message.includes('Unterminated string')
  ) {
    return '未返回可用内容';
  }

  if (message.includes('401') || message.toLowerCase().includes('api key')) {
    return '模型调用暂时不可用';
  }

  return '本轮未返回可用结果';
}
