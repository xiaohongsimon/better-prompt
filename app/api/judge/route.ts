import { NextRequest, NextResponse } from 'next/server';
import {
  buildJudgeUserPrompt,
  DEFAULT_JUDGE_SYSTEM_PROMPT,
  extractJsonObject,
  normalizeJudgePayload,
} from '@/lib/prompts/optimizer';
import { assertConfig, createClient, getEffectiveConfig, getModelMeta } from '@/lib/server/bailian';
import {
  enforceOrigin,
  enforceRateLimit,
  getClientIp,
  verifySubmissionProof,
} from '@/lib/server/security';
import type { ApiConfig, JudgePromptPayload, JudgeResult, OptimizedResult } from '@/types';

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
      return NextResponse.json({ error: 'No valid candidates to judge' }, { status: 400 });
    }

    if (!submissionProof || typeof submissionProof !== 'string') {
      return NextResponse.json({ error: 'Submission proof is required' }, { status: 400 });
    }

    enforceRateLimit(`judge:${getClientIp(request)}`);
    verifySubmissionProof(submissionProof, originalPrompt, validCandidates);

    const effectiveConfig = getEffectiveConfig(config as Partial<ApiConfig>);
    effectiveConfig.judgeSystemPrompt ||= DEFAULT_JUDGE_SYSTEM_PROMPT;
    assertConfig(effectiveConfig, 'judge');

    const client = createClient(effectiveConfig);
    const response = await client.chat.completions.create({
      model: effectiveConfig.judgeModel,
      temperature: effectiveConfig.judgeTemperature,
      max_tokens: effectiveConfig.judgeMaxTokens,
      messages: [
        { role: 'system', content: effectiveConfig.judgeSystemPrompt },
        { role: 'user', content: buildJudgeUserPrompt(originalPrompt, validCandidates) },
      ],
    });

    const content = response.choices[0]?.message?.content || '';
    const parsed = extractJsonObject(content) as JudgePromptPayload;
    const normalized = normalizeJudgePayload(parsed);

    const rankings: JudgeResult[] = normalized.ranking.map((entry, index) => {
      const meta = getModelMeta(entry.model);

      return {
        model: entry.model,
        modelName: meta.modelName,
        provider: meta.provider,
        score: entry.total_score,
        rank: index + 1,
        verdict: entry.verdict,
        strengths: entry.strengths?.slice(0, 4) || [],
        weaknesses: entry.weaknesses?.slice(0, 4) || [],
        improvementFocus: entry.improvement_focus?.slice(0, 4) || [],
        dimensionScores: {
          clarity: entry.dimension_scores?.clarity ?? 0,
          completeness: entry.dimension_scores?.completeness ?? 0,
          controllability: entry.dimension_scores?.controllability ?? 0,
          professionality: entry.dimension_scores?.professionality ?? 0,
          executionLikelihood: entry.dimension_scores?.execution_likelihood ?? 0,
        },
      };
    });

    return NextResponse.json({
      rankings,
      judgeSummary: normalized.overallSummary,
      synthesizedBestPrompt: normalized.synthesizedBestPrompt,
      synthesisRationale: normalized.synthesisRationale,
      appliedAdvantages: normalized.appliedAdvantages,
    });
  } catch (error) {
    console.error('Judge API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to judge prompts',
      },
      { status: 500 }
    );
  }
}
