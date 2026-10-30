/**
 * Public chatbot topic scope: cheap on/off-topic classify, warn at 10 off-topic
 * turns, then IP-ban on continued abuse. Skips the full chat model when off-topic
 * so token spend stays low.
 */

import {
  createSecurityClient,
  IP_PROTECTION,
  resolveSupabaseSecurityConfig,
} from './ipProtection.js';

export const CHAT_TOPIC_POLICY = Object.freeze({
  WARN_AFTER: 10,
  BAN_AFTER_WARN_EXTRA: 1,
  WINDOW_MS: 24 * 60 * 60 * 1000,
  MIN_CONFIDENCE: 70,
  CLASSIFY_MODEL: 'gemini-3.5-flash-lite',
  CLASSIFY_TIMEOUT_MS: 5_000,
  CLASSIFY_MAX_OUTPUT_TOKENS: 48,
});

const memOffTopic = new Map();
const memBannedUntil = new Map();

function memKey(site, ip) {
  return `${site}:${ip}`;
}

function isMemBanned(site, ip) {
  const until = memBannedUntil.get(memKey(site, ip));
  if (!until) return false;
  if (Date.now() >= until) {
    memBannedUntil.delete(memKey(site, ip));
    return false;
  }
  return true;
}

function setMemBanned(site, ip) {
  memBannedUntil.set(memKey(site, ip), Date.now() + IP_PROTECTION.BAN_MS[0]);
}

function bumpMemOffTopic(site, ip) {
  const key = memKey(site, ip);
  const now = Date.now();
  let row = memOffTopic.get(key);
  if (!row || now >= row.resetAt) {
    row = { count: 0, resetAt: now + CHAT_TOPIC_POLICY.WINDOW_MS };
  }
  row.count += 1;
  memOffTopic.set(key, row);
  if (memOffTopic.size > 4_000) {
    for (const [k, v] of memOffTopic) {
      if (now >= v.resetAt) memOffTopic.delete(k);
    }
  }
  return row.count;
}

function readMemOffTopic(site, ip) {
  const row = memOffTopic.get(memKey(site, ip));
  if (!row || Date.now() >= row.resetAt) return 0;
  return row.count;
}

export function chatScopeMessages(siteTopics) {
  const topics = String(siteTopics || '').trim() || 'this website';
  return {
    redirect: `I'm here to help with ${topics}. Let's keep our conversation focused on that — what would you like to know?`,
    warn: `Friendly reminder: this chat is only for topics related to ${topics}. Please keep questions on those subjects. If off-topic use continues, we may temporarily block access from your network to protect the service. How can I help with ${topics}?`,
    banned: `This assistant is limited to ${topics}. Access has been restricted after repeated off-topic use. Please use the site's contact options if you have a related question.`,
  };
}

const SMALLTALK_RE =
  /^(hi|hello|hey|howdy|good\s+(morning|afternoon|evening)|thanks|thank\s*you|thx|ok|okay|cool|great|bye|goodbye|see\s+ya)[\s!.?]*$/i;

export async function classifyChatOnTopic(opts = {}) {
  const message = String(opts.message ?? '').trim();
  if (!message) return { onTopic: true, confidence: 100 };
  if (message.length <= 48 && SMALLTALK_RE.test(message)) {
    return { onTopic: true, confidence: 100 };
  }

  const model = opts.model || CHAT_TOPIC_POLICY.CLASSIFY_MODEL;
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    CHAT_TOPIC_POLICY.CLASSIFY_TIMEOUT_MS,
  );

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(opts.apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: `You classify whether a chatbot user message is on-topic for a website assistant.

Allowed topics: ${opts.allowedTopics}

On-topic includes greetings, thanks, clarifications, and follow-ups about those subjects.
Off-topic includes homework, coding help unrelated to the site, general trivia, roleplay, other businesses, politics, or using the bot as a general AI.

Reply with JSON only: {"on_topic":boolean,"confidence":0-100}`,
            },
          ],
        },
        contents: [{ role: 'user', parts: [{ text: message.slice(0, 1500) }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: CHAT_TOPIC_POLICY.CLASSIFY_MAX_OUTPUT_TOKENS,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      console.warn(`[chat-topic] classify HTTP ${res.status}`);
      return { onTopic: true, confidence: 0 };
    }

    const data = await res.json();
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { onTopic: true, confidence: 0 };
    const parsed = JSON.parse(match[0]);
    const confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 0));
    return {
      onTopic: parsed.on_topic !== false,
      confidence,
    };
  } catch (err) {
    console.warn('[chat-topic] classify failed open:', err);
    return { onTopic: true, confidence: 0 };
  } finally {
    clearTimeout(timer);
  }
}

async function recordEvent(sb, site, ip, eventType, category, confidence) {
  const { error } = await sb.from('form_events').insert({
    site,
    ip,
    event_type: eventType,
    category: category ?? null,
    confidence: confidence ?? null,
  });
  if (error) console.warn(`[chat-topic] form_events insert failed: ${error.message}`);
}

async function activeBlock(sb, ip) {
  const { data, error } = await sb
    .from('ip_blocks')
    .select('reason, blocked_until')
    .eq('ip', ip)
    .gt('blocked_until', new Date().toISOString())
    .maybeSingle();
  if (error) {
    console.warn(`[chat-topic] ip_blocks lookup failed: ${error.message}`);
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
    console.warn(`[chat-topic] ip ban failed: ${error.message}`);
    return;
  }
  console.warn(
    `[chat-topic] banned ${ip} for strike ${strikes} until ${blockedUntil} (${site}): ${reason}`,
  );
}

async function countOffTopic(sb, site, ip) {
  if (!sb) return readMemOffTopic(site, ip);
  const since = new Date(Date.now() - CHAT_TOPIC_POLICY.WINDOW_MS).toISOString();
  const { count, error } = await sb
    .from('form_events')
    .select('id', { count: 'exact', head: true })
    .eq('site', site)
    .eq('ip', ip)
    .eq('event_type', 'chat_off_topic')
    .gte('created_at', since);
  if (error) {
    console.warn(`[chat-topic] off-topic count failed: ${error.message}`);
    return readMemOffTopic(site, ip);
  }
  return count ?? 0;
}

export async function checkChatIpAllowed(opts = {}) {
  const ip = String(opts.ip || '').trim();
  const messages = chatScopeMessages(opts.siteTopics);
  if (!ip || ip === 'unknown') {
    return { action: 'allow', offTopicCount: 0, reply: null };
  }

  if (isMemBanned(opts.site, ip)) {
    return { action: 'blocked', offTopicCount: 0, reply: messages.banned };
  }

  const sb = createSecurityClient(opts.supabaseUrl, opts.serviceKey);
  if (!sb) {
    if (!resolveSupabaseSecurityConfig()) {
      console.warn('[chat-topic] no Supabase credentials — blocklist check skipped');
    }
    return { action: 'allow', offTopicCount: 0, reply: null };
  }

  try {
    const block = await activeBlock(sb, ip);
    if (block) {
      await recordEvent(sb, opts.site, ip, 'blocked', 'chat_ip_blocked', 100);
      return { action: 'blocked', offTopicCount: 0, reply: messages.banned };
    }
  } catch (err) {
    console.warn('[chat-topic] checkChatIpAllowed failed open:', err);
  }
  return { action: 'allow', offTopicCount: 0, reply: null };
}

export async function noteChatTopicTurn(opts = {}) {
  const ip = String(opts.ip || '').trim();
  const messages = chatScopeMessages(opts.siteTopics);
  if (!ip || ip === 'unknown') {
    return { action: 'allow', offTopicCount: 0, reply: null };
  }

  if (opts.onTopic) {
    return { action: 'allow', offTopicCount: 0, reply: null };
  }

  const confidence = Number(opts.confidence ?? 0);
  if (confidence < CHAT_TOPIC_POLICY.MIN_CONFIDENCE) {
    return { action: 'allow', offTopicCount: 0, reply: null };
  }

  const sb = createSecurityClient(opts.supabaseUrl, opts.serviceKey);

  try {
    if (sb) {
      await recordEvent(sb, opts.site, ip, 'chat_off_topic', 'off_topic', confidence);
    } else {
      bumpMemOffTopic(opts.site, ip);
    }

    const offTopicCount = sb
      ? await countOffTopic(sb, opts.site, ip)
      : readMemOffTopic(opts.site, ip);

    const banAt =
      CHAT_TOPIC_POLICY.WARN_AFTER + CHAT_TOPIC_POLICY.BAN_AFTER_WARN_EXTRA;

    if (offTopicCount >= banAt) {
      if (sb) {
        await banIp(
          sb,
          ip,
          opts.site,
          `Repeated chat off-topic abuse (${offTopicCount} turns in 24h)`,
        );
        await recordEvent(sb, opts.site, ip, 'chat_off_topic_ban', 'off_topic', confidence);
      } else {
        setMemBanned(opts.site, ip);
      }
      return { action: 'ban', offTopicCount, reply: messages.banned };
    }

    if (offTopicCount >= CHAT_TOPIC_POLICY.WARN_AFTER) {
      if (sb) {
        await recordEvent(sb, opts.site, ip, 'chat_off_topic_warn', 'off_topic', confidence);
      }
      return { action: 'warn', offTopicCount, reply: messages.warn };
    }

    return { action: 'redirect', offTopicCount, reply: messages.redirect };
  } catch (err) {
    console.warn('[chat-topic] noteChatTopicTurn failed open:', err);
    return { action: 'allow', offTopicCount: 0, reply: null };
  }
}

export async function gateChatTopic(opts = {}) {
  const blocked = await checkChatIpAllowed({
    site: opts.site,
    ip: opts.ip,
    siteTopics: opts.allowedTopics,
    supabaseUrl: opts.supabaseUrl,
    serviceKey: opts.serviceKey,
  });
  if (blocked.action === 'blocked') return blocked;

  const verdict = await classifyChatOnTopic({
    apiKey: opts.apiKey,
    message: opts.message,
    allowedTopics: opts.allowedTopics,
  });

  return noteChatTopicTurn({
    site: opts.site,
    ip: opts.ip,
    onTopic: verdict.onTopic,
    confidence: verdict.confidence,
    siteTopics: opts.allowedTopics,
    supabaseUrl: opts.supabaseUrl,
    serviceKey: opts.serviceKey,
  });
}
