/**
 * Factory for subject-matter semantic screening (Gemini).
 * Pass a business-specific SYSTEM_PROMPT + field labels.
 * Fails open when key missing / API errors — prefilter still blocks blatant junk.
 */

import { GoogleGenAI } from '@google/genai';
import { HARD_LIMITS } from './apiUsageGuard.js';

const MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash'];
const ATTEMPT_TIMEOUT_MS = 7000;

const CATEGORIES = [
  'genuine_inquiry',
  'brief_but_plausible',
  'low_value',
  'spam_or_solicitation',
  'troll_or_abusive',
  'gibberish',
  'test_submission',
];

const REJECT_THRESHOLD = 60;
const REJECTABLE = new Set([
  'spam_or_solicitation',
  'troll_or_abusive',
  'gibberish',
  'test_submission',
]);

const BLOCKED_FINISH_REASONS = new Set([
  'SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'IMAGE_SAFETY',
]);

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: CATEGORIES },
    confidence: { type: 'integer', minimum: 0, maximum: 100 },
    reason: { type: 'string' },
    is_sales_pitch: { type: 'boolean' },
  },
  required: ['category', 'confidence', 'reason', 'is_sales_pitch'],
  additionalProperties: false,
  propertyOrdering: ['category', 'confidence', 'reason', 'is_sales_pitch'],
};

function parseVerdict(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    try {
      return match ? JSON.parse(match[0]) : null;
    } catch {
      return null;
    }
  }
}

function decide(category, confidence) {
  if (REJECTABLE.has(category)) {
    return confidence >= REJECT_THRESHOLD ? 'reject' : 'review';
  }
  if (category === 'low_value') return 'review';
  return 'accept';
}

const PASS = (category, reason) => ({
  decision: 'accept', category, confidence: 0, reason, screened: false,
});

const HOLD = (reason) => ({
  decision: 'review', category: 'unscreened', confidence: 0, reason, screened: false,
});

/**
 * @param {{
 *   businessName: string,
 *   systemPrompt: string,
 *   fieldOrder?: string[],
 *   freeTextKeys?: string[],
 *   envFlag?: string,
 *   apiKeyEnv?: string[],
 * }} config
 */
export function createScreener(config) {
  const {
    systemPrompt,
    fieldOrder = ['name', 'email', 'phone', 'message'],
    freeTextKeys = ['message', 'name'],
    envFlag = 'CONTACT_SCREENING',
    apiKeyEnv = ['HT_GEMINI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_GEMINI_API_KEY', 'GOOGLE_API_KEY'],
  } = config;

  function getKey() {
    for (const name of apiKeyEnv) {
      if (process.env[name]) return process.env[name];
    }
    return null;
  }

  function buildPrompt(submission, signals = {}) {
    const field = (label, value) => `${label}: ${value ? String(value) : '(not provided)'}`;
    const context = [
      field('Email looks deliverable', signals.emailOk === null || signals.emailOk === undefined ? null : String(signals.emailOk)),
      field('Phone verified', signals.phoneOk === null || signals.phoneOk === undefined ? null : String(signals.phoneOk)),
      field('Approx location', signals.geo),
      field('Prior submissions this hour', String(signals.priorSubmissions ?? 0)),
      field('Mild profanity flag', String(Boolean(signals.mildProfanity))),
    ].join('\n');

    const body = fieldOrder
      .map((key) => field(key, submission[key]))
      .join('\n');

    return `Screen this form submission.

<request_context>
${context}
</request_context>

<submission>
${body}
</submission>

Classify it.`;
  }

  return async function screenSubmission(submission, signals = {}) {
    if (process.env[envFlag] === 'off') {
      return PASS('unscreened', 'Screening disabled by configuration.');
    }

    const apiKey = getKey();
    if (!apiKey) {
      console.warn(`[${config.businessName}] Gemini key not set — screening skipped`);
      return PASS('unscreened', 'Screening unavailable.');
    }

    const freeText = freeTextKeys
      .map((k) => submission[k])
      .filter(Boolean)
      .join(' ')
      .trim();
    if (!freeText) {
      return PASS('brief_but_plausible', 'Contact details only — nothing to screen.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(submission, signals);
    const deadline = Date.now() + HARD_LIMITS.SCREEN_TOTAL_BUDGET_MS;
    const attempts = [MODEL, ...FALLBACK_MODELS];
    let lastError = null;

    for (const model of attempts) {
      const remaining = deadline - Date.now();
      if (remaining <= 500) break;

      let response;
      try {
        response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseJsonSchema: VERDICT_SCHEMA,
            maxOutputTokens: HARD_LIMITS.SCREEN_MAX_OUTPUT_TOKENS,
            thinkingConfig: { thinkingLevel: 'MINIMAL' },
            abortSignal: AbortSignal.timeout(Math.min(ATTEMPT_TIMEOUT_MS, remaining)),
          },
        });
      } catch (err) {
        lastError = err;
        console.warn(`Screening on ${model} failed:`, String(err?.message ?? err).slice(0, 140));
        continue;
      }

      const blockReason = response.promptFeedback?.blockReason;
      const finishReason = response.candidates?.[0]?.finishReason;
      if (blockReason || BLOCKED_FINISH_REASONS.has(finishReason)) {
        return {
          decision: 'reject',
          category: 'troll_or_abusive',
          confidence: 100,
          reason: `Content blocked by safety filters (${blockReason ?? finishReason}).`,
          screened: true,
        };
      }

      const verdict = response.text ? parseVerdict(response.text) : null;
      if (!verdict) {
        lastError = new Error('unreadable verdict');
        continue;
      }

      const category = CATEGORIES.includes(verdict.category) ? verdict.category : 'genuine_inquiry';
      const confidence = Math.max(0, Math.min(100, Number(verdict.confidence) || 0));

      return {
        decision: decide(category, confidence),
        category,
        confidence,
        reason: String(verdict.reason ?? '').slice(0, 300),
        isSalesPitch: Boolean(verdict.is_sales_pitch),
        screened: true,
      };
    }

    console.error(`[${config.businessName}] screening exhausted:`, lastError?.message ?? lastError);
    return HOLD('Screening unavailable — flagged for manual review.');
  };
}
