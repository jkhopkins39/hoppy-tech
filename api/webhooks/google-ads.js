/**
 * Google Ads Lead Form webhook — Hoppy Tech
 *
 * Endpoint (after deploy):
 *   POST https://hoppytech.com/api/webhooks/google-ads
 *
 * Configure in Google Ads lead form:
 *   Webhook URL  → https://www.hoppytech.com/api/webhooks/google-ads
 *   Google key   → same value as env GOOGLE_ADS_WEBHOOK_KEY
 *
 * IMPORTANT: Use the www host. Apex hoppytech.com 308-redirects to www,
 * and Google Ads webhooks typically fail on redirects.
 * Payload shape (Google Lead Form Webhook):
 * {
 *   lead_id, campaign_id, form_id, google_key | Google_key, is_test, gcl_id,
 *   user_column_data: [
 *     { column_id: "FULL_NAME",     column_name: "Full Name",    string_value: "…" },
 *     { column_id: "EMAIL",         column_name: "User Email",   string_value: "…" },
 *     { column_id: "PHONE_NUMBER",  column_name: "User Phone",   string_value: "…" },
 *     { column_id: "…",             column_name: "Business size", string_value: "…" } // custom Q
 *   ]
 * }
 *
 * Note: hoppy-tech is Vite + Vercel `/api` (not Next.js App Router).
 * This file is the production handler. A Next-style sketch is not needed at runtime.
 */

import { Resend } from 'resend';
import { getEdgeCorsHeaders } from '../_lib/cors.js';
import { getIntakeRecipients } from '../_lib/intakeEmail.js';
import { getSupabaseHoppyAdmin } from '../_lib/supabase-admin.js';

export const config = { runtime: 'edge' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Timing-safe string compare for the Google webhook key. */
function keysMatch(provided, expected) {
  if (!provided || !expected) return false;
  const a = String(provided);
  const b = String(expected);
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Google puts form answers in `user_column_data` (repeated objects).
 * Prefer `column_id` when present; fall back to fuzzy `column_name` match
 * because custom questions (e.g. business size) often only have a label.
 */
function extractFields(userColumnData) {
  const columns = Array.isArray(userColumnData) ? userColumnData : [];

  const byId = (id) =>
    columns.find((c) => String(c?.column_id ?? '').toUpperCase() === id)?.string_value;

  const byIdIncludes = (...needles) => {
    const found = columns.find((c) => {
      const id = String(c?.column_id ?? '').toLowerCase();
      return needles.some((n) => id.includes(n));
    });
    return found?.string_value;
  };

  const byName = (...needles) => {
    const found = columns.find((c) => {
      const name = String(c?.column_name ?? '').toLowerCase();
      return needles.some((n) => name.includes(n));
    });
    return found?.string_value;
  };

  // Standard Google field IDs:
  // FULL_NAME, EMAIL / WORK_EMAIL, PHONE_NUMBER, COMPANY_NAME, …
  const fullName =
    pickString(byId('FULL_NAME')) ||
    pickString(byName('full name', 'name')) ||
    null;

  const email =
    pickString(byId('EMAIL')) ||
    pickString(byId('WORK_EMAIL')) ||
    pickString(byName('email')) ||
    null;

  const phone =
    pickString(byId('PHONE_NUMBER')) ||
    pickString(byName('phone', 'phone number', 'user phone')) ||
    null;

  // Custom Q example from Ads: column_id "what_size_is_your_company?" → "1-10"
  // Do NOT match COMPANY_NAME (that is the company name field, not size).
  const businessSize =
    pickString(byId('BUSINESS_SIZE')) ||
    pickString(
      byIdIncludes(
        'what_size',
        'business_size',
        'company_size',
        'team_size',
        'size_is_your_company',
        'size_is_your',
      ),
    ) ||
    pickString(byName('business size', 'company size', 'team size', 'employees', 'size is your company')) ||
    null;

  return { fullName, email, phone, businessSize };
}

function pickString(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s.slice(0, 500) : null;
}

function asTextId(value) {
  if (value == null || value === '') return null;
  return String(value);
}

function json(status, body, corsHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export default async function handler(req) {
  const corsHeaders = getEdgeCorsHeaders(req, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    // Google expects: 4xx → { "message": "..." }
    return json(405, { message: 'Method not allowed' }, corsHeaders);
  }

  const expectedKey = process.env.GOOGLE_ADS_WEBHOOK_KEY;
  if (!expectedKey) {
    console.error('GOOGLE_ADS_WEBHOOK_KEY is not set');
    return json(503, { message: 'Webhook not configured' }, corsHeaders);
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return json(400, { message: 'Invalid JSON body' }, corsHeaders);
  }

  // Auth: Google puts the key in the JSON (`google_key` or `Google_key`).
  // Also accept query `?google_key=` / `?key=` or `X-Google-Key` / `Authorization: Bearer …`
  // so you can harden the URL if desired.
  const url = new URL(req.url);
  const providedKey =
    body.google_key ||
    body.Google_key ||
    url.searchParams.get('google_key') ||
    url.searchParams.get('key') ||
    req.headers.get('x-google-key') ||
    (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');

  if (!keysMatch(providedKey, expectedKey)) {
    return json(401, { message: 'Unauthorized' }, corsHeaders);
  }

  const leadId = asTextId(body.lead_id);
  if (!leadId) {
    return json(400, { message: 'Missing lead_id' }, corsHeaders);
  }

  // Google’s array is `user_column_data`. Accept `user_column` as a defensive alias.
  const userColumns = body.user_column_data ?? body.user_column ?? [];
  const { fullName, email, phone, businessSize } = extractFields(userColumns);

  if (email && !EMAIL_RE.test(email)) {
    return json(400, { message: 'Invalid email in payload' }, corsHeaders);
  }

  if (!email && !phone) {
    return json(400, { message: 'Lead missing email and phone' }, corsHeaders);
  }

  const sb = getSupabaseHoppyAdmin();
  if (!sb) {
    return json(503, { message: 'Database not configured' }, corsHeaders);
  }

  // Idempotent: duplicate Google retries with the same lead_id should succeed.
  const { data: existing } = await sb
    .from('google_leads')
    .select('id, lead_id')
    .eq('lead_id', leadId)
    .maybeSingle();

  // Google success response body must be `{}` (empty JSON object).
  if (existing) {
    return json(200, {}, corsHeaders);
  }

  const campaignId = asTextId(body.campaign_id);
  const formId = asTextId(body.form_id);
  const gclId = asTextId(body.gcl_id);
  const isTest = Boolean(body.is_test);

  // Mirror into contact_submissions so the existing admin Messages tab shows
  // Google Ads leads in real time without a separate UI.
  const problemLines = [
    'Lead source: Google Ads lead form webhook',
    businessSize ? `Business size: ${businessSize}` : null,
    campaignId ? `Campaign ID: ${campaignId}` : null,
    formId ? `Form ID: ${formId}` : null,
    `Lead ID: ${leadId}`,
    isTest ? 'THIS IS A GOOGLE TEST LEAD (is_test=true)' : null,
  ].filter(Boolean);

  const submission = {
    email: email || null,
    phone: phone || null,
    name: fullName || null,
    company: businessSize || null,
    project_type: 'Google Ads Lead',
    problem: problemLines.join('\n'),
    timeline: null,
    budget: null,
    source: 'google_ads',
    google_lead_id: leadId,
    read: false,
  };

  const { data: contactRow, error: contactError } = await sb
    .from('contact_submissions')
    .insert(submission)
    .select('id')
    .single();

  if (contactError) {
    console.error('contact_submissions insert error:', contactError);
    return json(500, { message: 'Failed to save lead' }, corsHeaders);
  }

  const googleLead = {
    lead_id: leadId,
    campaign_id: campaignId,
    form_id: formId,
    full_name: fullName,
    email,
    phone_number: phone,
    business_size: businessSize,
    gcl_id: gclId,
    is_test: isTest,
    raw_payload: body,
    contact_submission_id: contactRow?.id ?? null,
  };

  const { error: leadError } = await sb.from('google_leads').insert(googleLead);

  if (leadError) {
    console.error('google_leads insert error:', leadError);
    // Contact row already saved — still return 200 so Google does not retry forever.
    return json(200, {}, corsHeaders);
  }

  // Best-effort email notify (do not fail the webhook if Resend is down).
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const row = (label, value) =>
        value
          ? `<tr>
              <td style="padding:8px 0;color:#6b7280;width:150px;vertical-align:top;font-size:13px;">${label}</td>
              <td style="padding:8px 0;color:#111827;font-size:14px;">${value}</td>
            </tr>`
          : '';

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e;">
          <div style="background:#0a0f2e;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
            <div style="color:#7dd3fc;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">
              Google Ads Lead${isTest ? ' (TEST)' : ''}
            </div>
          </div>
          <div style="background:#f8fafc;padding:36px 32px;">
            <table style="width:100%;border-collapse:collapse;">
              ${row('Name', escapeHtml(fullName))}
              ${row('Email', email ? escapeHtml(email) : '')}
              ${row('Phone', phone ? `<a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>` : '')}
              ${row('Business size', escapeHtml(businessSize))}
              ${row('Campaign', escapeHtml(campaignId))}
              ${row('Form', escapeHtml(formId))}
              ${row('Lead ID', escapeHtml(leadId))}
            </table>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'Hoppy Tech Intake <hello@hoppytech.com>',
        to: getIntakeRecipients(),
        subject: `Google Ads lead${fullName ? ` — ${fullName.slice(0, 40)}` : ''}${isTest ? ' [TEST]' : ''}`,
        html,
        ...(email ? { replyTo: email } : {}),
      });
    } catch (err) {
      console.error('Google Ads lead notify email failed:', err);
    }
  }

  return json(200, {}, corsHeaders);
}
