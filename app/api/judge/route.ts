import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { JUDGE_SYSTEM_PROMPT, JUDGE_USER_PROMPT } from '@/lib/prompts/optimizer';
import { AVAILABLE_MODELS } from '@/types';
import type { JudgeResult, ApiConfig } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { originalPrompt, candidates, config } = await request.json();

    if (!originalPrompt || !candidates || !Array.isArray(candidates)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (!config || !config.baseUrl || !config.apiKey || !config.judgeModel) {
      return NextResponse.json({ error: 'API configuration is required' }, { status: 400 });
    }

    // Filter out failed candidates
    const validCandidates = candidates.filter(
      (c: { optimizedPrompt: string; error?: string }) => c.optimizedPrompt && !c.error
    );

    if (validCandidates.length === 0) {
      return NextResponse.json({ error: 'No valid candidates to judge' }, { status: 400 });
    }

    const apiConfig = config as ApiConfig;
    const openai = new OpenAI({
      baseURL: apiConfig.baseUrl,
      apiKey: apiConfig.apiKey,
    });

    const modelInfo = AVAILABLE_MODELS.find(m => m.id === apiConfig.judgeModel);

    const response = await openai.chat.completions.create({
      model: apiConfig.judgeModel,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: JUDGE_SYSTEM_PROMPT },
        { role: 'user', content: JUDGE_USER_PROMPT(originalPrompt, validCandidates) },
      ],
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse judge response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const rankings: JudgeResult[] = parsed.rankings.map(
      (r: { model: string; score: number; reason: string }, index: number) => {
        const candidateModel = AVAILABLE_MODELS.find(m => m.id === r.model || m.name === r.model);
        return {
          model: r.model,
          modelName: candidateModel?.name || r.model,
          score: r.score,
          reason: r.reason,
          rank: index + 1,
        };
      }
    );

    return NextResponse.json({ rankings });
  } catch (error) {
    console.error('Judge API error:', error);
    return NextResponse.json(
      { error: 'Failed to judge prompts' },
      { status: 500 }
    );
  }
}