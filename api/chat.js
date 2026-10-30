import { GoogleGenAI } from '@google/genai';
import { CHAT_SYSTEM_PROMPT } from './_lib/chatPrompt.js';
import { getEdgeCorsHeaders } from './_lib/cors.js';
import { getGeminiApiKey } from './_lib/env.js';
import {
  HARD_LIMITS,
  guardPublicChat,
  chatOutputTokenCap,
  clampChatInput,
  getClientIpFromHeaders,
} from './_lib/apiUsageGuard.js';
import { gateChatTopic } from './_lib/chatTopicGuard.js';

export const config = { runtime: 'edge' };

const CHAT_SITE = 'hoppy-tech';
const CHAT_ALLOWED_TOPICS =
  "Jeremy Hopkins' portfolio and services: his background, skills, projects, hiring/intake, quotes, and contacting Jeremy about web/AI work";

function ndjsonReply(text, req) {
  const body = `${JSON.stringify({ t: text })}\n${JSON.stringify({ done: true })}\n`;
  return new Response(body, {
    headers: {
      ...getEdgeCorsHeaders(req),
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}

// Prefer current stable Flash models; preview last as a last resort.
const PRIMARY_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3-flash-preview'];
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 300;
/** Env cannot raise these above HARD_LIMITS. */
const MAX_MESSAGES = HARD_LIMITS.CHAT_MAX_MESSAGES;
const MAX_MESSAGE_LENGTH = HARD_LIMITS.CHAT_MAX_INPUT_CHARS;

function jsonResponse(body, status, req) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getEdgeCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function isRetryable(err) {
  const m = String(err?.message ?? err).toLowerCase();
  return m.includes('503') || m.includes('429') || m.includes('unavailable')
    || m.includes('overloaded') || m.includes('high demand') || m.includes('resource exhausted');
}

function isModelUnavailable(err) {
  const m = String(err?.message ?? err).toLowerCase();
  return m.includes('not found') || m.includes('not supported') || m.includes('invalid model')
    || m.includes('unknown model') || m.includes('404');
}

function friendlyError(err) {
  const m = String(err?.message ?? err).toLowerCase();
  if (m.includes('503') || m.includes('unavailable') || m.includes('high demand') || m.includes('overloaded')) {
    return 'The AI model is temporarily overloaded. Please try again in a moment.';
  }
  if (m.includes('429') || m.includes('resource exhausted')) {
    return 'Rate limit reached. Please wait a moment and try again.';
  }
  if (m.includes('401') || m.includes('403') || m.includes('api key') || m.includes('api_key')) {
    return 'API authentication error. Please contact Jeremy.';
  }
  if (isModelUnavailable(err)) {
    return 'Chat model is unavailable right now. Please try again shortly.';
  }
  return 'An unexpected error occurred. Please try again.';
}

async function streamWithModel(ai, model, contents, genConfig, writer, enc) {
  const stream = await ai.models.generateContentStream({
    model,
    contents,
    config: genConfig,
  });

  for await (const chunk of stream) {
    const text = chunk.text || '';
    if (text) await writer.write(enc.encode(`${JSON.stringify({ t: text })}\n`));
  }
  await writer.write(enc.encode(`${JSON.stringify({ done: true })}\n`));
}

export default async function handler(req) {
  const corsHeaders = getEdgeCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, req);
  }

  const ip = getClientIpFromHeaders(req.headers);
  const usage = guardPublicChat(ip, { maxPerHour: HARD_LIMITS.CHAT_PER_IP_HOUR });
  if (!usage.ok) {
    return jsonResponse({ error: usage.error }, usage.status, req);
  }

  // Read key inside the handler so Edge always sees the deployed HT_* value.
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.error('chat: HT_GEMINI_API_KEY is not set');
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

  const latestUser = clampChatInput(
    String(conversation[conversation.length - 1]?.content ?? '').slice(0, MAX_MESSAGE_LENGTH),
  );

  const topicGate = await gateChatTopic({
    site: CHAT_SITE,
    ip,
    message: latestUser,
    allowedTopics: CHAT_ALLOWED_TOPICS,
    apiKey,
  });
  if (topicGate.action !== 'allow' && topicGate.reply) {
    return ndjsonReply(topicGate.reply, req);
  }

  const contents = conversation.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: clampChatInput(String(m.content ?? '').slice(0, MAX_MESSAGE_LENGTH)) }],
  }));

  const genConfig = {
    maxOutputTokens: chatOutputTokenCap(1024),
    temperature: 0.6,
    systemInstruction: CHAT_SYSTEM_PROMPT,
  };

  const ai = new GoogleGenAI({ apiKey });
  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS];

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();

  (async () => {
    let lastErr;
    modelLoop: for (const model of models) {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
          await streamWithModel(ai, model, contents, genConfig, writer, enc);
          lastErr = null;
          break modelLoop;
        } catch (err) {
          lastErr = err;
          console.error(`chat: model=${model} attempt=${attempt}`, err?.message || err);
          if (isModelUnavailable(err)) break;
          if (attempt < MAX_RETRIES && isRetryable(err)) continue;
          break;
        }
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
