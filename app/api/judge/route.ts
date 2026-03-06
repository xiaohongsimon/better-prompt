import { NextRequest, NextResponse } from 'next/server';
import { JUDGE_SYSTEM_PROMPT, JUDGE_USER_PROMPT } from '@/lib/prompts/optimizer';
import type { JudgeResponse, JudgeResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { originalPrompt, candidates, apiKey } = await request.json();

    if (!originalPrompt || !candidates || !Array.isArray(candidates)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Zhipu API Key is required' }, { status: 400 });
    }

    // Filter out failed candidates
    const validCandidates = candidates.filter((c: { optimizedPrompt: string; error?: string }) => c.optimizedPrompt && !c.error);

    if (validCandidates.length === 0) {
      return NextResponse.json({ error: 'No valid candidates to judge' }, { status: 400 });
    }

    const rankings = await judgeWithGLM(originalPrompt, validCandidates, apiKey);

    const response: JudgeResponse = { rankings };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Judge API error:', error);
    return NextResponse.json(
      { error: 'Failed to judge prompts' },
      { status: 500 }
    );
  }
}

async function judgeWithGLM(originalPrompt: string, candidates: Array<{ model: string; optimizedPrompt: string }>, apiKey: string): Promise<JudgeResult[]> {
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'glm-4-plus',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: JUDGE_SYSTEM_PROMPT },
        { role: 'user', content: JUDGE_USER_PROMPT(originalPrompt, candidates) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`GLM API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse judge response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return parsed.rankings.map((r: { model: string; score: number; reason: string }, index: number) => ({
    model: r.model as 'claude' | 'gpt4' | 'gemini',
    score: r.score,
    reason: r.reason,
    rank: index + 1,
  }));
}