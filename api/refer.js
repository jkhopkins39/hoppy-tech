import { Resend } from 'resend';
import { getEdgeCorsHeaders } from './_lib/cors.js';
import { getIntakeRecipients } from './_lib/intakeEmail.js';
import { getResendApiKey } from './_lib/env.js';
import { getClientMeta } from './_lib/clientMeta.js';
import { validateSchema } from './_lib/validateSchema.js';
import {
  prefilter,
  hasMildProfanity,
  isOwnerTestSubmission,
  OWNER_TEST_SCREENING,
} from './_lib/contentFilter.js';
import { screenRefer } from './_lib/screenRefer.js';
import { guardFormSubmission } from './_lib/apiUsageGuard.js';

export const config = { runtime: 'edge' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REFER_SCHEMA = {
  referrer_name: { required: true, max: 120, message: 'Your name is required.' },
  referrer_email: { required: true, max: 254, message: 'A valid email is required.' },
  business_name: { required: true, max: 120, message: 'The business name is required.' },
  contact_name: { max: 120 },
  contact_email: { max: 254 },
  notes: { max: 3000 },
  contact_website: { max: 200 },
  contact_fax: { max: 40 },
};

function json(body, status, corsHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  const parsed = validateSchema(body, REFER_SCHEMA);
  if (!parsed.ok) {
    return json({ success: false, field: parsed.field, message: parsed.message }, 400, corsHeaders);
  }

  const {
    referrer_name,
    referrer_email,
    business_name,
    contact_name = '',
    contact_email = '',
    notes = '',
    contact_website: honeypot1 = '',
    contact_fax: honeypot2 = '',
  } = parsed.data;

  if (honeypot1 || honeypot2) {
    return json({ success: true }, 200, corsHeaders);
  }

  if (!EMAIL_RE.test(String(referrer_email))) {
    return json(
      { success: false, field: 'referrer_email', message: 'Your name, email, and the business name are required.' },
      400,
      corsHeaders,
    );
  }

  if (contact_email && !EMAIL_RE.test(String(contact_email))) {
    return json(
      { success: false, field: 'contact_email', message: 'That contact email doesn’t look valid.' },
      400,
      corsHeaders,
    );
  }

  const meta = getClientMeta(req);
  const rate = guardFormSubmission(meta.ip || 'unknown');
  if (!rate.ok) {
    return json({ success: false, message: rate.error }, rate.status, corsHeaders);
  }

  const submission = {
    referrer_name: String(referrer_name),
    referrer_email: String(referrer_email).trim().toLowerCase(),
    business_name: String(business_name),
    contact_name: contact_name ? String(contact_name) : '',
    contact_email: contact_email ? String(contact_email).trim().toLowerCase() : '',
    notes: notes ? String(notes) : '',
  };

  const TEXT_KEYS = ['referrer_name', 'business_name', 'notes'];

  // Owner test: referrer named Jeremy (or jeremy@hoppytech.com) skips prefilter + AI.
  const ownerTest = isOwnerTestSubmission({ ...submission, email: submission.referrer_email });
  const blocked = ownerTest ? null : prefilter(submission, TEXT_KEYS);

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
      : await screenRefer(submission, {
          geo: meta.geo,
          mildProfanity: hasMildProfanity(submission, [...TEXT_KEYS, 'contact_name']),
        });

  // Referrals aren't stored; rejected spam simply never reaches Resend.
  if (screening.decision === 'reject') {
    console.warn(
      `Refer rejected [${screening.category}] from ${meta.ip ?? 'unknown IP'}: ${screening.reason}`,
    );
    return json(
      { success: false, rejected: true, category: screening.category, message: screening.reason },
      200,
      corsHeaders,
    );
  }

  const resend = new Resend(getResendApiKey());

  const row = (label, value) =>
    value ? `<tr>
      <td style="padding:8px 0;color:#6b7280;width:160px;vertical-align:top;font-size:13px;">${label}</td>
      <td style="padding:8px 0;color:#111827;font-size:14px;">${value}</td>
    </tr>` : '';

  const flagged = screening.decision === 'review';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e;">
      <div style="background:#0a0f2e;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
        <img src="https://hoppytech.com/WebsiteLogo.png" alt="Hoppy Tech" height="48"
             style="display:inline-block;margin-bottom:12px;" />
        <div style="color:#7dd3fc;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">Referral Lead</div>
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
          ${row('Referred by', `<strong>${escapeHtml(submission.referrer_name.slice(0, 120))}</strong> &lt;${escapeHtml(submission.referrer_email.slice(0, 254))}&gt;`)}
          ${row('Business', `<strong>${escapeHtml(submission.business_name.slice(0, 120))}</strong>`)}
          ${row('Their contact', escapeHtml(submission.contact_name.slice(0, 120)))}
          ${row('Their email', submission.contact_email ? `<a href="mailto:${escapeHtml(submission.contact_email.slice(0, 254))}" style="color:#0369a1;">${escapeHtml(submission.contact_email.slice(0, 254))}</a>` : '')}
        </table>

        ${submission.notes.trim() ? `
        <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Notes</p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;white-space:pre-wrap;">${escapeHtml(submission.notes.slice(0, 3000))}</p>
        </div>` : ''}

        <div style="margin-top:24px;padding:16px;background:#fef9c3;border-radius:8px;border:1px solid #fde047;">
          <p style="margin:0;font-size:13px;color:#854d0e;">
            💰 <strong>Bounty:</strong> ${escapeHtml(submission.referrer_name.slice(0, 60))} is owed <strong>$20</strong> when this client signs on.
          </p>
        </div>
      </div>

      <div style="background:#e0f2fe;padding:20px 32px;border-radius:0 0 12px 12px;text-align:center;">
        <p style="margin:0;font-size:13px;color:#0369a1;">
          Hoppy Tech · Referral Program ·
          <a href="https://hoppytech.com" style="color:#0369a1;">hoppytech.com</a>
        </p>
      </div>
    </div>
  `;

  try {
    const to = getIntakeRecipients();

    await resend.emails.send({
      from: 'Hoppy Tech Referrals <hello@hoppytech.com>',
      to,
      replyTo: submission.referrer_email,
      subject: `${flagged ? '[Review] ' : ''}Referral — ${submission.business_name.slice(0, 60)} via ${submission.referrer_name.slice(0, 40)}`,
      html,
    });

    return json({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('Refer API error:', err);
    return json(
      { success: false, message: 'Failed to send. Please email directly.' },
      500,
      corsHeaders,
    );
  }
}
