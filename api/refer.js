import { Resend } from 'resend';
import { getEdgeCorsHeaders } from './_lib/cors.js';

export const config = { runtime: 'edge' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req) {
  const corsHeaders = getEdgeCorsHeaders(req, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ success: false, message: 'Invalid request' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const {
    referrer_name = '',
    referrer_email = '',
    business_name = '',
    contact_name = '',
    contact_email = '',
    notes = '',
    contact_website: honeypot1 = '',
    contact_fax: honeypot2 = '',
  } = body;

  if (honeypot1 || honeypot2) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!referrer_name?.trim() || !referrer_email || !EMAIL_RE.test(String(referrer_email)) || !business_name?.trim()) {
    return new Response(JSON.stringify({ success: false, message: 'Your name, email, and the business name are required.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const row = (label, value) =>
    value ? `<tr>
      <td style="padding:8px 0;color:#6b7280;width:160px;vertical-align:top;font-size:13px;">${label}</td>
      <td style="padding:8px 0;color:#111827;font-size:14px;">${value}</td>
    </tr>` : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e;">
      <div style="background:#0a0f2e;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
        <img src="https://hoppytech.com/WebsiteLogo.png" alt="Hoppy Tech" height="48"
             style="display:inline-block;margin-bottom:12px;" />
        <div style="color:#7dd3fc;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">Referral Lead</div>
      </div>

      <div style="background:#f8fafc;padding:36px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          ${row('Referred by', `<strong>${String(referrer_name).slice(0, 120)}</strong> &lt;${String(referrer_email).slice(0, 254)}&gt;`)}
          ${row('Business', `<strong>${String(business_name).slice(0, 120)}</strong>`)}
          ${row('Their contact', String(contact_name).slice(0, 120))}
          ${row('Their email', contact_email ? `<a href="mailto:${String(contact_email).slice(0, 254)}" style="color:#0369a1;">${String(contact_email).slice(0, 254)}</a>` : '')}
        </table>

        ${notes?.trim() ? `
        <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Notes</p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;white-space:pre-wrap;">${String(notes).slice(0, 3000)}</p>
        </div>` : ''}

        <div style="margin-top:24px;padding:16px;background:#fef9c3;border-radius:8px;border:1px solid #fde047;">
          <p style="margin:0;font-size:13px;color:#854d0e;">
            💰 <strong>Bounty:</strong> ${String(referrer_name).slice(0, 60)} is owed <strong>$20</strong> when this client signs on.
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
    const to = process.env.RESEND_TO ?? 'jeremy@hoppytech.com';

    await resend.emails.send({
      from: 'Hoppy Tech Referrals <hello@hoppytech.com>',
      to,
      replyTo: String(referrer_email).trim(),
      subject: `Referral — ${String(business_name).slice(0, 60)} via ${String(referrer_name).slice(0, 40)}`,
      html,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Refer API error:', err);
    return new Response(JSON.stringify({ success: false, message: 'Failed to send. Please email directly.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
