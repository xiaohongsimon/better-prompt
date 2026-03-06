import { NextRequest, NextResponse } from 'next/server';
import { createSubmissionProof, enforceOrigin, enforceRateLimit, getClientIp } from '@/lib/server/security';
import type { OptimizedResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    enforceOrigin(request);
    enforceRateLimit(`proof:${getClientIp(request)}`);

    const { originalPrompt, candidates } = await request.json();

    if (!originalPrompt || typeof originalPrompt !== 'string') {
      return NextResponse.json({ error: 'Original prompt is required' }, { status: 400 });
    }

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ error: 'Candidates are required' }, { status: 400 });
    }

    const validCandidates = (candidates as OptimizedResult[]).filter(
      (candidate) => candidate.optimizedPrompt && !candidate.error
    );

    if (validCandidates.length === 0) {
      return NextResponse.json({ error: 'No valid candidates to sign' }, { status: 400 });
    }

    return NextResponse.json({
      submissionProof: createSubmissionProof(originalPrompt, validCandidates),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create submission proof' },
      { status: 500 }
    );
  }
}
