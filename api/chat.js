import { GoogleGenAI } from '@google/genai';
import { CHAT_SYSTEM_PROMPT } from './_lib/chatPrompt.js';
import { getEdgeCorsHeaders } from './_lib/cors.js';

export const config = { runtime: 'edge' };

const MODEL = 'gemini-3-flash-preview';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 300;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY;

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const rateBuckets = new Map();

function jsonResponse(body, status, req) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getEdgeCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function getClientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
  }
  bucket.count += 1;
  rateBuckets.set(ip, bucket);
  return bucket.count > RATE_LIMIT;
}

function isRetryable(err) {
  const m = String(err?.message ?? err).toLowerCase();
  return m.includes('503') || m.includes('429') || m.includes('unavailable')
    || m.includes('overloaded') || m.includes('high demand') || m.includes('resource exhausted');
}

function friendlyError(err) {
  const m = String(err?.message ?? err).toLowerCase();
  if (m.includes('503') || m.includes('unavailable') || m.includes('high demand') || m.includes('overloaded')) {
    return 'The AI model is temporarily overloaded. Please try again in a moment.';
  }
  if (m.includes('429') || m.includes('resource exhausted')) {
    return 'Rate limit reached. Please wait a moment and try again.';
  }
  if (m.includes('401') || m.includes('403') || m.includes('api key')) {
    return 'API authentication error. Please contact Jeremy.';
  }
  return 'An unexpected error occurred. Please try again.';
}

export default async function handler(req) {
  const corsHeaders = getEdgeCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, req);
  }

  if (isRateLimited(getClientIp(req))) {
    return jsonResponse({ error: 'Too many requests. Please try again later.' }, 429, req);
  }

  if (!ai) {
    return jsonResponse({ error: 'Chat is temporarily unavailable.' }, 503, req);
  }

  let messages;
  try {
    ({ messages } = await req.json());
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, req);
  }

  if (!Array.isArray(messages)) {
    return jsonResponse({ error: 'messages must be an array' }, 400, req);
  }

  const conversation = messages
    .filter((m) => m?.role === 'user' || m?.role === 'assistant')
    .slice(-MAX_MESSAGES);

  if (conversation.length === 0 || conversation[conversation.length - 1]?.role !== 'user') {
    return jsonResponse({ error: 'A user message is required' }, 400, req);
  }

  const contents = conversation.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content ?? '').slice(0, MAX_MESSAGE_LENGTH) }],
  }));

  const genConfig = {
    maxOutputTokens: 1024,
    temperature: 0.6,
    systemInstruction: CHAT_SYSTEM_PROMPT,
  };

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();

  (async () => {
    let lastErr;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));

        const stream = await ai.models.generateContentStream({
          model: MODEL,
          contents,
          config: genConfig,
        });

        for await (const chunk of stream) {
          const text = chunk.text || '';
          if (text) await writer.write(enc.encode(`${JSON.stringify({ t: text })}\n`));
        }
        await writer.write(enc.encode(`${JSON.stringify({ done: true })}\n`));
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        if (attempt < MAX_RETRIES && isRetryable(err)) continue;
        break;
      }
    }

    if (lastErr) {
      try {
        await writer.write(enc.encode(`${JSON.stringify({ error: friendlyError(lastErr) })}\n`));
      } catch {
        /* writer already closed */
      }
    }

    try {
      await writer.close();
    } catch {
      /* already closed */
    }
  })();

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
