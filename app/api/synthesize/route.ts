import { NextRequest, NextResponse } from 'next/server';
import {
  buildSynthesizerUserPrompt,
  DEFAULT_SYNTHESIZER_SYSTEM_PROMPT,
  parseJudgeResponse,
} from '@/lib/prompts/optimizer';
import { assertConfig, createClient, getEffectiveConfig } from '@/lib/server/bailian';
import {
  enforceOrigin,
  enforceRateLimit,
  getClientIp,
  verifySubmissionProof,
} from '@/lib/server/security';
import type { ApiConfig, OptimizedResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    enforceOrigin(request);

    const { originalPrompt, candidates, config, submissionProof } = await request.json();

    if (!originalPrompt || typeof originalPrompt !== 'string') {
      return NextResponse.json({ error: 'Original prompt is required' }, { status: 400 });
    }

    if (!Array.isArray(candidates)) {
      return NextResponse.json({ error: 'Candidates are required' }, { status: 400 });
    }

    const validCandidates = (candidates as OptimizedResult[]).filter(
      (candidate) => candidate.optimizedPrompt && !candidate.error
    );

    if (validCandidates.length === 0) {
      return NextResponse.json({ error: 'No valid candidates to synthesize' }, { status: 400 });
    }

    if (!submissionProof || typeof submissionProof !== 'string') {
      return NextResponse.json({ error: 'Submission proof is required' }, { status: 400 });
    }

    enforceRateLimit(`synthesize:${getClientIp(request)}`);
    verifySubmissionProof(submissionProof, originalPrompt, validCandidates);

    const effectiveConfig = getEffectiveConfig(config as Partial<ApiConfig>);
    assertConfig(effectiveConfig, 'judge');

    const client = createClient(effectiveConfig);
    const response = await client.chat.completions.create({
      model: effectiveConfig.judgeModel,
      temperature: 0.15,
      max_tokens: 1800,
      messages: [
        { role: 'system', content: DEFAULT_SYNTHESIZER_SYSTEM_PROMPT },
        { role: 'user', content: buildSynthesizerUserPrompt(originalPrompt, validCandidates) },
      ],
    });

    const content = response.choices[0]?.message?.content || '';
    const normalized = parseJudgeResponse(content);

    return NextResponse.json({
      synthesizedBestPrompt: normalized.synthesizedBestPrompt,
      synthesisRationale: normalized.synthesisRationale,
      appliedAdvantages: normalized.appliedAdvantages,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to synthesize prompt',
      },
      { status: 500 }
    );
  }
}
