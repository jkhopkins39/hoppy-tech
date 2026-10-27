/**
 * Hardcoded usage limits for paid / AI API keys.
 * Prevents key-drain exploits even if auth is bypassed or a session is stolen.
 *
 * Limits are intentionally in code (not only env) so misconfigured envs cannot
 * open the floodgates. Env can only tighten, never raise above HARD_* ceilings.
 */

/** Absolute ceilings — env may only set lower values. */
export const HARD_LIMITS = Object.freeze({
  /** Public contact / quote / lead forms per IP */
  FORM_PER_IP_HOUR: 8,
  FORM_MIN_GAP_MS: 30_000,

  /** Public AI chat per IP */
  CHAT_PER_IP_HOUR: 20,
  CHAT_MAX_INPUT_CHARS: 2_000,
  CHAT_MAX_MESSAGES: 20,
  CHAT_MAX_OUTPUT_TOKENS: 2_048,

  /** Semantic screening calls (Gemini) per IP — already behind form limit */
  SCREEN_MAX_OUTPUT_TOKENS: 512,
  SCREEN_TOTAL_BUDGET_MS: 16_000,

  /** Authenticated admin AI (Anthropic generate-post, etc.) per user/IP */
  ADMIN_AI_PER_HOUR: 30,
  ADMIN_AI_MAX_OUTPUT_TOKENS: 1_200,
  ADMIN_COMMENT_MAX_TOKENS: 256,

  /** Email (Resend) sends attributable to public forms per IP */
  EMAIL_PER_IP_HOUR: 8,

  /** Global process soft cap for AI calls (all keys, all routes) per hour */
  GLOBAL_AI_PER_HOUR: 200,
});

const buckets = new Map();

function clampMax(requested, hardCeiling) {
  const n = Number(requested);
  if (!Number.isFinite(n) || n <= 0) return hardCeiling;
  return Math.min(Math.floor(n), hardCeiling);
}

/**
 * Sliding fixed-window counter. Returns { allowed, remaining, resetAt }.
 * @param {string} key
 * @param {number} maxRequests
 * @param {number} windowMs
 */
export function checkUsage(key, maxRequests, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (buckets.size > 8_000) {
    for (const [k, b] of buckets) {
      if (now >= b.resetAt) buckets.delete(k);
    }
  }

  const allowed = bucket.count <= maxRequests;
  return {
    allowed,
    remaining: Math.max(0, maxRequests - bucket.count),
    resetAt: bucket.resetAt,
    count: bucket.count,
  };
}

/** Form submission gate: hourly + optional min-gap between posts from same IP. */
export function guardFormSubmission(ip, opts = {}) {
  const max = clampMax(opts.maxPerHour ?? process.env.FORM_RATE_LIMIT_PER_HOUR, HARD_LIMITS.FORM_PER_IP_HOUR);
  const minGap = clampMax(opts.minGapMs ?? process.env.FORM_MIN_GAP_MS, HARD_LIMITS.FORM_MIN_GAP_MS);
  const hour = checkUsage(`form:${ip}`, max);
  if (!hour.allowed) {
    return { ok: false, status: 429, error: 'Too many requests', code: 'rate_limited' };
  }
  const gapKey = `form-gap:${ip}`;
  const last = buckets.get(gapKey);
  const now = Date.now();
  if (last && typeof last.lastAt === 'number' && now - last.lastAt < minGap) {
    return { ok: false, status: 429, error: 'Please wait before submitting again', code: 'min_gap' };
  }
  buckets.set(gapKey, { lastAt: now, resetAt: now + minGap, count: 1 });
  return { ok: true, remaining: hour.remaining };
}

/** Public AI chat gate. */
export function guardPublicChat(ip, opts = {}) {
  const max = clampMax(opts.maxPerHour, HARD_LIMITS.CHAT_PER_IP_HOUR);
  const result = checkUsage(`chat:${ip}`, max);
  if (!result.allowed) {
    return { ok: false, status: 429, error: 'Chat rate limit reached. Try again later.', code: 'chat_rate_limited' };
  }
  const global = checkUsage('global-ai', HARD_LIMITS.GLOBAL_AI_PER_HOUR);
  if (!global.allowed) {
    return { ok: false, status: 503, error: 'AI temporarily unavailable.', code: 'global_ai_cap' };
  }
  return { ok: true, remaining: result.remaining };
}

/** Admin / authenticated AI gate (still capped — stolen sessions cannot drain keys). */
export function guardAdminAi(identity, opts = {}) {
  const max = clampMax(opts.maxPerHour, HARD_LIMITS.ADMIN_AI_PER_HOUR);
  const result = checkUsage(`admin-ai:${identity}`, max);
  if (!result.allowed) {
    return { ok: false, status: 429, error: 'AI usage limit reached for this hour.', code: 'admin_ai_rate_limited' };
  }
  const global = checkUsage('global-ai', HARD_LIMITS.GLOBAL_AI_PER_HOUR);
  if (!global.allowed) {
    return { ok: false, status: 503, error: 'AI temporarily unavailable.', code: 'global_ai_cap' };
  }
  return { ok: true, remaining: result.remaining };
}

export function clampChatInput(text) {
  return String(text ?? '').slice(0, HARD_LIMITS.CHAT_MAX_INPUT_CHARS);
}

export function chatOutputTokenCap(requested) {
  return clampMax(requested, HARD_LIMITS.CHAT_MAX_OUTPUT_TOKENS);
}

export function adminOutputTokenCap(requested) {
  return clampMax(requested, HARD_LIMITS.ADMIN_AI_MAX_OUTPUT_TOKENS);
}

export function getClientIpFromHeaders(headers) {
  if (!headers) return 'unknown';
  const get = typeof headers.get === 'function'
    ? (k) => headers.get(k)
    : (k) => headers[k] ?? headers[k.toLowerCase()];
  const forwarded = get('x-forwarded-for');
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return get('x-real-ip') || 'unknown';
}
