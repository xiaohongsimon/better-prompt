import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import type { OptimizedResult } from '@/types';

type RateWindow = {
  count: number;
  resetAt: number;
};

const rateStore = new Map<string, RateWindow>();
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 8);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const MAX_PROMPT_CHARS = Number(process.env.MAX_PROMPT_CHARS ?? 4000);
const PROOF_TTL_MS = Number(process.env.SUBMISSION_PROOF_TTL_MS ?? 10 * 60 * 1000);

export function getSecurityConfig() {
  return {
    isProduction: process.env.NODE_ENV === 'production',
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '',
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY?.trim() || '',
    rateLimitMax: RATE_LIMIT_MAX,
    rateLimitWindowMs: RATE_LIMIT_WINDOW_MS,
    maxPromptChars: MAX_PROMPT_CHARS,
  };
}

export function validatePrompt(prompt: string) {
  if (!prompt.trim()) {
    throw new Error('提示词不能为空。');
  }

  if (prompt.length > MAX_PROMPT_CHARS) {
    throw new Error(`提示词过长，请控制在 ${MAX_PROMPT_CHARS} 字符以内。`);
  }
}

export function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') || 'unknown';
}

export function enforceOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin || !host) return;

  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`,
    ...(process.env.ALLOWED_ORIGINS?.split(',').map((item) => item.trim()).filter(Boolean) || []),
  ];

  if (!allowedOrigins.includes(origin)) {
    throw new Error('非法来源请求已被拒绝。');
  }
}

export function enforceRateLimit(key: string) {
  const now = Date.now();
  const current = rateStore.get(key);

  if (!current || current.resetAt <= now) {
    rateStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return;
  }

  if (current.count >= RATE_LIMIT_MAX) {
    const seconds = Math.ceil((current.resetAt - now) / 1000);
    throw new Error(`请求过于频繁，请在 ${seconds} 秒后重试。`);
  }

  current.count += 1;
  rateStore.set(key, current);
}

export async function verifyTurnstileToken(token: string, request: NextRequest) {
  const { isProduction, turnstileSecretKey } = getSecurityConfig();

  if (!isProduction || !turnstileSecretKey) {
    return;
  }

  if (!turnstileSecretKey) {
    throw new Error('服务端未配置 Turnstile Secret Key。');
  }

  if (!token) {
    throw new Error('请先完成安全验证。');
  }

  const formData = new FormData();
  formData.append('secret', turnstileSecretKey);
  formData.append('response', token);

  const remoteip = getClientIp(request);
  if (remoteip && remoteip !== 'unknown') {
    formData.append('remoteip', remoteip);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('安全验证服务不可用，请稍后重试。');
  }

  const payload = (await response.json()) as { success?: boolean };
  if (!payload.success) {
    throw new Error('安全验证失败，请刷新后重试。');
  }
}

export function createSubmissionProof(originalPrompt: string, candidates: OptimizedResult[]) {
  const secret = getProofSecret();
  const issuedAt = Date.now();
  const digest = hashPayload(originalPrompt, candidates);
  const payload = `${issuedAt}.${digest}`;
  const signature = createHmac('sha256', secret).update(payload).digest('hex');

  return `${payload}.${signature}`;
}

export function verifySubmissionProof(
  proof: string,
  originalPrompt: string,
  candidates: OptimizedResult[]
) {
  const secret = getProofSecret();
  const [issuedAtRaw, digest, signature] = proof.split('.');

  if (!issuedAtRaw || !digest || !signature) {
    throw new Error('无效的评审凭证。');
  }

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > PROOF_TTL_MS) {
    throw new Error('评审凭证已过期，请重新生成候选结果。');
  }

  const expectedDigest = hashPayload(originalPrompt, candidates);
  if (expectedDigest !== digest) {
    throw new Error('评审凭证与候选内容不匹配。');
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(`${issuedAtRaw}.${digest}`)
    .digest('hex');

  const actualBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error('评审凭证校验失败。');
  }
}

function hashPayload(originalPrompt: string, candidates: OptimizedResult[]) {
  const normalized = JSON.stringify({
    originalPrompt,
    candidates: candidates.map((candidate) => ({
      model: candidate.model,
      optimizedPrompt: candidate.optimizedPrompt,
      strategySummary: candidate.strategySummary,
      keyUpgrades: candidate.keyUpgrades,
      applicableScenarios: candidate.applicableScenarios,
    })),
  });

  return createHash('sha256').update(normalized).digest('hex');
}

function getProofSecret() {
  const secret =
    process.env.APP_SIGNING_SECRET?.trim() ||
    process.env.BAILIAN_API_KEY?.trim() ||
    process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    throw new Error('服务端缺少签名密钥，请配置 APP_SIGNING_SECRET。');
  }

  return secret;
}
