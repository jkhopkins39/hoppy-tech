/**
 * Shared DB-backed IP blocklist + form rate limits.
 * Uses schema `security` on the Hoppy Tech Supabase project.
 */

import { createClient } from '@supabase/supabase-js';
import { HARD_LIMITS } from './apiUsageGuard.js';

export const IP_PROTECTION = Object.freeze({
  AUTO_BAN_CONFIDENCE: 80,
  STRIKE_WINDOW_MS: 14 * 24 * 60 * 60 * 1000,
  RATE_LIMIT_STRIKE_WINDOW_MS: 24 * 60 * 60 * 1000,
  BAN_MS: Object.freeze([
    24 * 60 * 60 * 1000,
    7 * 24 * 60 * 60 * 1000,
    30 * 24 * 60 * 60 * 1000,
  ]),
});

function clampMax(requested, hardCeiling) {
  const n = Number(requested);
  if (!Number.isFinite(n) || n <= 0) return hardCeiling;
  return Math.min(Math.floor(n), hardCeiling);
}

function firstEnv(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function resolveSupabaseSecurityConfig() {
  const url = firstEnv(
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'HT_SUPABASE_PROJECT_URL',
    'SUPABASE_PROJECT_URL',
  );
  const key = firstEnv(
    'SUPABASE_SECRET_KEY',
    'HT_SUPABASE_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_ROLE_JWT',
  );
  if (!url || !key) return null;
  return { url, key };
}

export function createSecurityClient(url, key) {
  const resolved = url && key ? { url, key } : resolveSupabaseSecurityConfig();
  if (!resolved) return null;
  return createClient(resolved.url, resolved.key, {
    db: { schema: 'security' },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function recordEvent(sb, site, ip, eventType, category, confidence) {
  const { error } = await sb.from('form_events').insert({
    site,
    ip,
    event_type: eventType,
    category: category ?? null,
    confidence: confidence ?? null,
  });
  if (error) console.warn(`[security] form_events insert failed: ${error.message}`);
}

async function activeBlock(sb, ip) {
  const { data, error } = await sb
    .from('ip_blocks')
    .select('reason, blocked_until')
    .eq('ip', ip)
    .gt('blocked_until', new Date().toISOString())
    .maybeSingle();
  if (error) {
    console.warn(`[security] ip_blocks lookup failed: ${error.message}`);
    return null;
  }
  return data ?? null;
}

async function banIp(sb, ip, site, reason) {
  const { data: existing } = await sb
    .from('ip_blocks')
    .select('strike_count, blocked_until, updated_at')
    .eq('ip', ip)
    .maybeSingle();

  let strikes = 1;
  if (existing) {
    const lastTouch = new Date(existing.updated_at || existing.blocked_until).getTime();
    const stillInWindow = Date.now() - lastTouch < IP_PROTECTION.STRIKE_WINDOW_MS;
    strikes = stillInWindow
      ? Math.min((existing.strike_count || 1) + 1, IP_PROTECTION.BAN_MS.length)
      : 1;
  }

  const duration = IP_PROTECTION.BAN_MS[Math.min(strikes, IP_PROTECTION.BAN_MS.length) - 1];
  const blockedUntil = new Date(Date.now() + duration).toISOString();
  const { error } = await sb.from('ip_blocks').upsert(
    {
      ip,
      reason: String(reason).slice(0, 500),
      source_site: site,
      strike_count: strikes,
      blocked_until: blockedUntil,
      updated_at: new Date().toISOString(),
      ...(existing ? {} : { created_at: new Date().toISOString() }),
    },
    { onConflict: 'ip' },
  );
  if (error) {
    console.warn(`[security] ip ban failed: ${error.message}`);
    return;
  }
  console.warn(
    `[security] banned ${ip} for strike ${strikes} until ${blockedUntil} (${site}): ${reason}`,
  );
}

async function maybeBanForRateLimit(sb, site, ip) {
  const since = new Date(Date.now() - IP_PROTECTION.RATE_LIMIT_STRIKE_WINDOW_MS).toISOString();
  const { count, error } = await sb
    .from('form_events')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .eq('event_type', 'rate_limited')
    .gte('created_at', since);
  if (error) {
    console.warn(`[security] rate-limit strike lookup failed: ${error.message}`);
    return;
  }
  if ((count ?? 0) >= 2) {
    await banIp(sb, ip, site, 'Repeated form rate-limit hits within 24h');
  }
}

/** Blocklist + DB rate limit. Fail-open when security schema is unreachable. */
export async function enforceIpProtection(opts = {}) {
  const ip = String(opts.ip || '').trim();
  if (!ip || ip === 'unknown') {
    return { ok: true, remaining: HARD_LIMITS.FORM_PER_IP_HOUR };
  }

  const max = clampMax(
    opts.maxPerHour ?? process.env.FORM_RATE_LIMIT_PER_HOUR,
    HARD_LIMITS.FORM_PER_IP_HOUR,
  );
  const minGap = clampMax(
    opts.minGapMs ?? process.env.FORM_MIN_GAP_MS,
    HARD_LIMITS.FORM_MIN_GAP_MS,
  );

  const sb = createSecurityClient(opts.supabaseUrl, opts.serviceKey);
  if (!sb) {
    console.warn('[security] no Supabase service credentials — IP protection skipped');
    return { ok: true, remaining: max };
  }

  try {
    const block = await activeBlock(sb, ip);
    if (block) {
      await recordEvent(sb, opts.site, ip, 'blocked', 'ip_blocked', 100);
      return { ok: false, status: 200, error: 'OK', code: 'ip_blocked' };
    }

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recent, error } = await sb
      .from('form_events')
      .select('created_at, event_type')
      .eq('site', opts.site)
      .eq('ip', ip)
      .eq('event_type', 'attempt')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.warn(`[security] form_events lookup failed: ${error.message}`);
      return { ok: true, remaining: max };
    }

    const rows = recent ?? [];
    const newest = rows[0]?.created_at ? new Date(rows[0].created_at).getTime() : null;
    if (newest && Date.now() - newest < minGap) {
      await recordEvent(sb, opts.site, ip, 'rate_limited', 'min_gap', 100);
      await maybeBanForRateLimit(sb, opts.site, ip);
      return {
        ok: false,
        status: 429,
        error: 'Please wait before submitting again',
        code: 'min_gap',
      };
    }

    if (rows.length >= max) {
      await recordEvent(sb, opts.site, ip, 'rate_limited', 'rate_limited', 100);
      await maybeBanForRateLimit(sb, opts.site, ip);
      return {
        ok: false,
        status: 429,
        error: 'Too many requests',
        code: 'rate_limited',
      };
    }

    await recordEvent(sb, opts.site, ip, 'attempt');
    return { ok: true, remaining: Math.max(0, max - rows.length - 1) };
  } catch (err) {
    console.warn('[security] enforceIpProtection failed open:', err);
    return { ok: true, remaining: max };
  }
}

/** After screening: log outcome and auto-ban high-confidence rejects. */
export async function noteScreeningForIp(opts = {}) {
  const ip = String(opts.ip || '').trim();
  if (!ip || ip === 'unknown') return;

  const sb = createSecurityClient(opts.supabaseUrl, opts.serviceKey);
  if (!sb) return;

  try {
    const eventType =
      opts.decision === 'reject'
        ? opts.source === 'prefilter'
          ? 'prefilter_reject'
          : 'ai_reject'
        : opts.decision === 'review'
          ? 'ai_review'
          : 'accept';

    await recordEvent(sb, opts.site, ip, eventType, opts.category, opts.confidence);

    const confidence = Number(opts.confidence ?? 0);
    if (opts.decision === 'reject' && confidence >= IP_PROTECTION.AUTO_BAN_CONFIDENCE) {
      await banIp(
        sb,
        ip,
        opts.site,
        `${opts.source} reject [${opts.category || 'unknown'}] @${confidence}`,
      );
    }
  } catch (err) {
    console.warn('[security] noteScreeningForIp failed:', err);
  }
}
