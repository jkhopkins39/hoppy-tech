import { Resend } from 'resend';
import { getEdgeCorsHeaders } from './_lib/cors.js';
import { getIntakeRecipients } from './_lib/intakeEmail.js';
import { getResendApiKey } from './_lib/env.js';
import { getSupabaseHoppyAdmin } from './_lib/supabase-admin.js';
import { getClientMeta } from './_lib/clientMeta.js';
import { validateEmail, validatePhone } from './_lib/validateContact.js';
import { validateSchema } from './_lib/validateSchema.js';
import {
  prefilter,
  hasMildProfanity,
  isOwnerTestSubmission,
  OWNER_TEST_SCREENING,
} from './_lib/contentFilter.js';
import { screenSubmission } from './_lib/screenSubmission.js';
import { HARD_LIMITS } from './_lib/apiUsageGuard.js';
import {
  enforceIpProtection,
  noteScreeningForIp,
} from './_lib/ipProtection.js';

export const config = { runtime: 'edge' };

/** Env may only tighten — never raise above HARD_LIMITS.FORM_PER_IP_HOUR. */
function clampedFormLimit(requested, fallback) {
  const n = Number(requested);
  const base = Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
  return Math.min(base, HARD_LIMITS.FORM_PER_IP_HOUR);
}

/** Max submissions per IP per hour, and the minimum gap between two of them. */
const MAX_PER_HOUR = clampedFormLimit(process.env.CONTACT_RATE_LIMIT_PER_HOUR, 5);
const MIN_GAP_MS = Math.max(45_000, HARD_LIMITS.FORM_MIN_GAP_MS);

const CONTACT_SCHEMA = {
  email: { max: 254 },
  phone: { max: 40 },
  name: { max: 120 },
  company: { max: 120 },
  project_type: { max: 120 },
  problem: { max: 5000 },
  timeline: { max: 120 },
  budget: { max: 120 },
  include_design_team: { type: 'boolean' },
  contact_website: { max: 200 },
  contact_fax: { max: 40 },
};

/** Columns added by 20260727_contact_security.sql — dropped if the migration hasn't run yet. */
const SECURITY_COLUMNS = [
  'ip_address', 'user_agent', 'referer', 'geo',
  'screening_decision', 'screening_category', 'screening_confidence', 'screening_reason',
  'validation',
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function json(body, status, corsHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Recent submissions from this IP. Returns null when the check can't run
 * (no IP, or the security migration hasn't been applied) so we fail open.
 */
async function getRecentActivity(sb, ip) {
  if (!ip) return null;

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data, error } = await sb
    .from('contact_submissions')
    .select('created_at')
    .eq('ip_address', ip)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.warn('IP rate-limit lookup skipped:', error.message);
    return null;
  }

  const newest = data?.[0]?.created_at ? new Date(data[0].created_at).getTime() : null;
  return { count: data?.length ?? 0, msSinceLast: newest ? Date.now() - newest : null };
}

/** Insert, retrying without the security columns if the migration hasn't been run. */
async function insertSubmission(sb, row) {
  const { data, error } = await sb.from('contact_submissions').insert(row).select('id').single();
  if (!error) return { id: data?.id ?? null, degraded: false };

  const missingColumn = error.code === 'PGRST204' || error.code === '42703';
  if (!missingColumn) return { error };

  console.warn('Security columns missing — run supabase/migrations/20260727_contact_security.sql');
  const base = { ...row };
  for (const column of SECURITY_COLUMNS) delete base[column];

  const retry = await sb.from('contact_submissions').insert(base).select('id').single();
  if (retry.error) return { error: retry.error };
  return { id: retry.data?.id ?? null, degraded: true };
}

export default async function handler(req) {
  const corsHeaders = getEdgeCorsHeaders(req, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const body = await req.json().catch(() => null);
  const parsed = validateSchema(body, CONTACT_SCHEMA);
  if (!parsed.ok) {
    return json(
      { success: false, field: parsed.field, message: parsed.message ?? 'Invalid request' },
      400,
      corsHeaders,
    );
  }

  const {
    email = '',
    phone = '',
    name = '',
    company = '',
    project_type = '',
    problem = '',
    timeline = '',
    budget = '',
    include_design_team = false,
    contact_website: honeypot1 = '',
    contact_fax: honeypot2 = '',
  } = parsed.data;

  // Bots fill the hidden fields — give them a success they can't learn from.
  if (honeypot1 || honeypot2) {
    return json({ success: true }, 200, corsHeaders);
  }

  const meta = getClientMeta(req);

  const rawEmail = String(email).trim().slice(0, 254);
  const rawPhone = String(phone).trim().slice(0, 40);

  if (!rawEmail && !rawPhone) {
    return json({ success: false, message: 'Please provide an email or phone number.' }, 400, corsHeaders);
  }

  // ── Verify the contact details are real ──────────────────────────────
  const [emailCheck, phoneCheck] = await Promise.all([
    validateEmail(rawEmail, { ip: meta.ip }),
    validatePhone(rawPhone),
  ]);

  if (!emailCheck.ok) {
    return json({ success: false, field: 'email', message: emailCheck.message }, 400, corsHeaders);
  }
  if (!phoneCheck.ok) {
    return json({ success: false, field: 'phone', message: phoneCheck.message }, 400, corsHeaders);
  }

  const sb = getSupabaseHoppyAdmin();
  if (!sb) {
    console.error('Supabase not configured for contact insert');
    return json({ success: false, message: 'Submission storage is not configured.' }, 503, corsHeaders);
  }

  const cleanProblem = String(problem).trim().slice(0, 5000) || 'No description provided.';

  const submission = {
    email: emailCheck.value,
    phone: phoneCheck.value ?? (rawPhone || null),
    name: name ? String(name).trim().slice(0, 120) : null,
    company: company ? String(company).trim().slice(0, 120) : null,
    project_type: project_type ? String(project_type).slice(0, 120) : null,
    problem: cleanProblem,
    timeline: timeline ? String(timeline).slice(0, 120) : null,
    budget: budget ? String(budget).slice(0, 120) : null,
  };

  // ── Screening ────────────────────────────────────────────────────────
  // The deterministic filter runs first: it needs no network call, so blatant
  // trolling is still caught when the model is rate-limited or unavailable.
  // Owner tests (name contains "Jeremy" / jeremy@hoppytech.com) skip prefilter
  // + AI, skip IP rate limits, and always email.
  const forScreening = { ...submission, problem: String(problem).trim() };
  const ownerTest = isOwnerTestSubmission(forScreening);

  // ── Shared DB blocklist + rate limit (skipped for owner tests) ─────
  let priorSubmissions = 0;
  if (!ownerTest) {
    const gate = await enforceIpProtection({
      site: 'hoppy_tech',
      ip: meta.ip,
      maxPerHour: MAX_PER_HOUR,
      minGapMs: MIN_GAP_MS,
    });
    if (!gate.ok) {
      if (gate.code === 'ip_blocked') {
        return json({ success: true }, 200, corsHeaders);
      }
      return json(
        {
          success: false,
          message:
            gate.code === 'min_gap'
              ? 'You just sent a message. Give it a moment before sending another.'
              : 'Too many submissions from this connection. Please email jeremy@hoppytech.com directly.',
        },
        gate.status,
        corsHeaders,
      );
    }
    priorSubmissions = Math.max(0, MAX_PER_HOUR - (gate.remaining ?? 0) - 1);
  }
  const blocked = ownerTest ? null : prefilter(forScreening);

  const screening = ownerTest
    ? OWNER_TEST_SCREENING
    : blocked
      ? {
          decision: 'reject',
          category: blocked.category,
          confidence: 100,
          reason: blocked.reason,
          screened: true,
          prefiltered: blocked.matched,
        }
      : await screenSubmission(forScreening, {
          emailOk: emailCheck.value ? true : null,
          phoneOk: phoneCheck.value ? true : null,
          geo: meta.geo,
          priorSubmissions,
          fromQuote: Boolean(include_design_team),
          mildProfanity: hasMildProfanity(forScreening),
        });

  if (!ownerTest) {
    await noteScreeningForIp({
      site: 'hoppy_tech',
      ip: meta.ip,
      decision: screening.decision,
      category: screening.category,
      confidence: screening.confidence,
      source: blocked ? 'prefilter' : 'ai',
    });
  }

  // Everything is stored, including rejections, so false positives are recoverable.
  const row = {
    ...submission,
    ip_address: meta.ip,
    user_agent: meta.userAgent,
    referer: meta.referer,
    geo: meta.geo,
    screening_decision: screening.decision,
    screening_category: screening.category,
    screening_confidence: screening.confidence,
    screening_reason: screening.reason,
    validation: {
      email: emailCheck.checks,
      phone: phoneCheck.checks,
      screened: screening.screened,
      prefiltered: screening.prefiltered ?? null,
      is_sales_pitch: screening.isSalesPitch ?? false,
      owner_test: Boolean(screening.ownerTest),
      include_design_team: Boolean(include_design_team),
    },
  };

  const inserted = await insertSubmission(sb, row);
  if (inserted.error) {
    console.error('Supabase insert error:', inserted.error);
    return json({ success: false, message: 'Failed to save your submission. Please try again.' }, 500, corsHeaders);
  }

  if (screening.decision === 'reject') {
    console.warn(`Contact rejected [${screening.category}] from ${meta.ip ?? 'unknown IP'}: ${screening.reason}`);
    return json(
      { success: false, rejected: true, category: screening.category, message: screening.reason },
      200,
      corsHeaders,
    );
  }

  const resendKey = getResendApiKey();
  if (!resendKey) {
    console.error('HT_RESEND_API_KEY is not set');
    return json({ success: false, message: 'Email service not configured.' }, 503, corsHeaders);
  }

  const resend = new Resend(resendKey);

  const row_ = (label, value) =>
    value ? `<tr>
      <td style="padding:8px 0;color:#6b7280;width:150px;vertical-align:top;font-size:13px;">${label}</td>
      <td style="padding:8px 0;color:#111827;font-size:14px;">${value}</td>
    </tr>` : '';

  const contactLine = submission.email
    ? `<strong>${escapeHtml(submission.name || 'Anonymous')}</strong> &lt;${escapeHtml(submission.email)}&gt;`
    : `<strong>${escapeHtml(submission.name || 'Anonymous')}</strong> (phone only)`;

  const flagged = screening.decision === 'review';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e;">
      <div style="background:#0a0f2e;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
        <img src="https://hoppytech.com/WebsiteLogo.png" alt="Hoppy Tech" height="48"
             style="display:inline-block;margin-bottom:12px;" />
        <div style="color:#7dd3fc;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">New Project Inquiry</div>
      </div>

      ${flagged ? `
      <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 20px;">
        <p style="margin:0;font-size:13px;color:#92400e;">
          <strong>Flagged for review</strong> — ${escapeHtml(screening.category)} (${screening.confidence}% confidence).
          ${escapeHtml(screening.reason)}
        </p>
      </div>` : ''}

      <div style="background:#f8fafc;padding:36px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          ${row_('From', contactLine)}
          ${row_('Phone', submission.phone ? `<a href="tel:${escapeHtml(submission.phone)}">${escapeHtml(submission.phone)}</a>` : '')}
          ${row_('Company', escapeHtml(submission.company))}
          ${row_('Project Type', escapeHtml(submission.project_type))}
          ${row_('Timeline', escapeHtml(submission.timeline))}
          ${row_('Budget', escapeHtml(submission.budget))}
          ${include_design_team ? row_('Design services', 'Yes — visual design requested') : ''}
        </table>

        <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">
            What they need solved
          </p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;white-space:pre-wrap;">${escapeHtml(cleanProblem)}</p>
        </div>

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
            ${escapeHtml(meta.ip ?? 'IP unavailable')}${meta.geo ? ` · ${escapeHtml(meta.geo)}` : ''}
            · screening: ${escapeHtml(screening.category)}
          </p>
        </div>
      </div>

      <div style="background:#e0f2fe;padding:20px 32px;border-radius:0 0 12px 12px;text-align:center;">
        <p style="margin:0;font-size:13px;color:#0369a1;">
          Hoppy Tech · Project Intake ·
          <a href="https://hoppytech.com" style="color:#0369a1;">hoppytech.com</a>
        </p>
      </div>
    </div>
  `;

  try {
    const to = getIntakeRecipients();
    const from = process.env.RESEND_FROM ?? 'Hoppy Tech Intake <hello@hoppytech.com>';

    const sendPayload = {
      from,
      to,
      subject: `${flagged ? '[Review] ' : ''}New Project Inquiry${project_type ? ` — ${String(project_type).slice(0, 60)}` : ''}${name ? ` from ${String(name).slice(0, 40)}` : ''}${include_design_team ? ' [Design]' : ''}`,
      html,
    };
    if (submission.email) sendPayload.replyTo = submission.email;

    const { error: sendError } = await resend.emails.send(sendPayload);

    if (sendError) throw sendError;

    return json({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('Contact API error:', err);
    return json({ success: false, message: 'Failed to send. Please email directly.' }, 500, corsHeaders);
  }
}
