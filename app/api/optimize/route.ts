import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OPTIMIZER_SYSTEM_PROMPT, OPTIMIZER_USER_PROMPT } from '@/lib/prompts/optimizer';
import type { OptimizedResult, OptimizeResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { prompt, apiKeys } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!apiKeys) {
      return NextResponse.json({ error: 'API Keys are required' }, { status: 400 });
    }

    // Run all optimizations in parallel
    const [claudeResult, gpt4Result, geminiResult] = await Promise.allSettled([
      apiKeys.anthropic ? optimizeWithClaude(prompt, apiKeys.anthropic) : Promise.reject(new Error('Missing Anthropic key')),
      apiKeys.openai ? optimizeWithGPT4(prompt, apiKeys.openai) : Promise.reject(new Error('Missing OpenAI key')),
      apiKeys.google ? optimizeWithGemini(prompt, apiKeys.google) : Promise.reject(new Error('Missing Google key')),
    ]);

    const results: OptimizedResult[] = [];

    if (claudeResult.status === 'fulfilled') {
      results.push({ model: 'claude', ...claudeResult.value });
    } else {
      results.push({ model: 'claude', optimizedPrompt: '', error: claudeResult.reason?.message || 'Failed' });
    }

    if (gpt4Result.status === 'fulfilled') {
      results.push({ model: 'gpt4', ...gpt4Result.value });
    } else {
      results.push({ model: 'gpt4', optimizedPrompt: '', error: gpt4Result.reason?.message || 'Failed' });
    }

    if (geminiResult.status === 'fulfilled') {
      results.push({ model: 'gemini', ...geminiResult.value });
    } else {
      results.push({ model: 'gemini', optimizedPrompt: '', error: geminiResult.reason?.message || 'Failed' });
    }

    const response: OptimizeResponse = { results };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Optimize API error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize prompt' },
      { status: 500 }
    );
  }
}

async function optimizeWithClaude(prompt: string, apiKey: string) {
  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: OPTIMIZER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: OPTIMIZER_USER_PROMPT(prompt) }],
  });

  const optimizedPrompt = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return { optimizedPrompt, rawResponse: optimizedPrompt };
}

async function optimizeWithGPT4(prompt: string, apiKey: string) {
  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2000,
    messages: [
      { role: 'system', content: OPTIMIZER_SYSTEM_PROMPT },
      { role: 'user', content: OPTIMIZER_USER_PROMPT(prompt) },
    ],
  });

  const optimizedPrompt = response.choices[0]?.message?.content || '';
  return { optimizedPrompt, rawResponse: optimizedPrompt };
}

async function optimizeWithGemini(prompt: string, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: OPTIMIZER_USER_PROMPT(prompt) }] }],
    systemInstruction: OPTIMIZER_SYSTEM_PROMPT,
  });

  const optimizedPrompt = result.response.text();
  return { optimizedPrompt, rawResponse: optimizedPrompt };
}