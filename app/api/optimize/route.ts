import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { OPTIMIZER_SYSTEM_PROMPT, OPTIMIZER_USER_PROMPT } from '@/lib/prompts/optimizer';
import { AVAILABLE_MODELS } from '@/types';
import type { OptimizedResult, ApiConfig } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { prompt, config } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!config || !config.baseUrl || !config.apiKey || !config.optimizerModels?.length) {
      return NextResponse.json({ error: 'API configuration is required' }, { status: 400 });
    }

    const apiConfig = config as ApiConfig;
    const openai = new OpenAI({
      baseURL: apiConfig.baseUrl,
      apiKey: apiConfig.apiKey,
    });

    // Run all optimizations in parallel
    const results = await Promise.all(
      apiConfig.optimizerModels.map(async (modelId) => {
        try {
          const modelInfo = AVAILABLE_MODELS.find(m => m.id === modelId);
          const response = await openai.chat.completions.create({
            model: modelId,
            max_tokens: 2000,
            messages: [
              { role: 'system', content: OPTIMIZER_SYSTEM_PROMPT },
              { role: 'user', content: OPTIMIZER_USER_PROMPT(prompt) },
            ],
          });

          const optimizedPrompt = response.choices[0]?.message?.content || '';

          return {
            model: modelId,
            modelName: modelInfo?.name || modelId,
            optimizedPrompt,
          } as OptimizedResult;
        } catch (error) {
          const modelInfo = AVAILABLE_MODELS.find(m => m.id === modelId);
          return {
            model: modelId,
            modelName: modelInfo?.name || modelId,
            optimizedPrompt: '',
            error: error instanceof Error ? error.message : 'Failed',
          } as OptimizedResult;
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Optimize API error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize prompt' },
      { status: 500 }
    );
  }
}