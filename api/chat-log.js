import { getEdgeCorsHeaders } from './_lib/cors.js';
import { getSupabaseHoppyAdmin } from './_lib/supabase-admin.js';

export const config = { runtime: 'edge' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateBuckets = new Map();

function getClientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
  bucket.count += 1;
  rateBuckets.set(ip, bucket);
  return bucket.count > RATE_LIMIT;
}

function json(body, status, req) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getEdgeCorsHeaders(req, 'POST, OPTIONS'), 'Content-Type': 'application/json' },
  });
}

export default async function handler(req) {
  const corsHeaders = getEdgeCorsHeaders(req, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  if (isRateLimited(getClientIp(req))) return json({ ok: false }, 429, req);

  const body = await req.json().catch(() => null);

  if (
    !body?.sessionId ||
    !UUID_RE.test(body.sessionId) ||
    !Array.isArray(body?.messages) ||
    body.messages.length > 60
  ) {
    return json({ ok: false }, 400, req);
  }

  const supabase = getSupabaseHoppyAdmin();
  if (!supabase) return json({ ok: false }, 503, req);

  const messages = body.messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

  const { error } = await supabase
    .from('chat_sessions')
    .upsert({ id: body.sessionId, messages, updated_at: new Date().toISOString() }, { onConflict: 'id' });

  if (error) {
    console.error('chat-log error:', error);
    return json({ ok: false }, 500, req);
  }

  return json({ ok: true }, 200, req);
}
