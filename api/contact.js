import { Resend } from 'resend';
import { getEdgeCorsHeaders } from './_lib/cors.js';
import { getSupabaseHoppyAdmin } from './_lib/supabase-admin.js';

export const config = { runtime: 'edge' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  if (!body) {
    return new Response(JSON.stringify({ success: false, message: 'Invalid request' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
    contact_website: honeypot1 = '',
    contact_fax: honeypot2 = '',
  } = body;

  if (honeypot1 || honeypot2) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const cleanEmail = String(email).trim().slice(0, 254);
  const cleanPhone = String(phone).trim().slice(0, 40);

  if (!cleanEmail && !cleanPhone) {
    return new Response(JSON.stringify({ success: false, message: 'Please provide an email or phone number.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (cleanEmail && !EMAIL_RE.test(cleanEmail)) {
    return new Response(JSON.stringify({ success: false, message: 'Invalid email address.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const cleanProblem = String(problem).trim().slice(0, 5000) || 'No description provided.';

  if (String(problem).length > 5000) {
    return new Response(JSON.stringify({ success: false, message: 'Input too long.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const submission = {
    email: cleanEmail || null,
    phone: cleanPhone || null,
    name: name ? String(name).slice(0, 120) : null,
    company: company ? String(company).slice(0, 120) : null,
    project_type: project_type ? String(project_type).slice(0, 120) : null,
    problem: cleanProblem,
    timeline: timeline ? String(timeline).slice(0, 120) : null,
    budget: budget ? String(budget).slice(0, 120) : null,
  };

  const sb = getSupabaseHoppyAdmin();
  if (!sb) {
    console.error('Supabase not configured for contact insert');
    return new Response(JSON.stringify({ success: false, message: 'Submission storage is not configured.' }), {
      status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error: dbError } = await sb.from('contact_submissions').insert(submission);
  if (dbError) {
    console.error('Supabase insert error:', dbError);
    return new Response(JSON.stringify({ success: false, message: 'Failed to save your submission. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return new Response(JSON.stringify({ success: false, message: 'Email service not configured.' }), {
      status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const row = (label, value) =>
    value ? `<tr>
      <td style="padding:8px 0;color:#6b7280;width:150px;vertical-align:top;font-size:13px;">${label}</td>
      <td style="padding:8px 0;color:#111827;font-size:14px;">${value}</td>
    </tr>` : '';

  const contactLine = cleanEmail
    ? `<strong>${escapeHtml(name || 'Anonymous')}</strong> &lt;${escapeHtml(cleanEmail)}&gt;`
    : `<strong>${escapeHtml(name || 'Anonymous')}</strong> (phone only)`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e;">
      <div style="background:#0a0f2e;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
        <img src="https://hoppytech.com/WebsiteLogo.png" alt="Hoppy Tech" height="48"
             style="display:inline-block;margin-bottom:12px;" />
        <div style="color:#7dd3fc;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">New Project Inquiry</div>
      </div>

      <div style="background:#f8fafc;padding:36px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          ${row('From', contactLine)}
          ${row('Phone', cleanPhone ? `<a href="tel:${escapeHtml(cleanPhone)}">${escapeHtml(cleanPhone)}</a>` : '')}
          ${row('Company', escapeHtml(company))}
          ${row('Project Type', escapeHtml(project_type))}
          ${row('Timeline', escapeHtml(timeline))}
          ${row('Budget', escapeHtml(budget))}
        </table>

        <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">
            What they need solved
          </p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;white-space:pre-wrap;">${escapeHtml(cleanProblem)}</p>
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
    const to = process.env.RESEND_TO ?? 'jeremy@hoppytech.com';
    const from = process.env.RESEND_FROM ?? 'Hoppy Tech Intake <hello@hoppytech.com>';

    const sendPayload = {
      from,
      to,
      subject: `New Project Inquiry${project_type ? ` — ${String(project_type).slice(0, 60)}` : ''}${name ? ` from ${String(name).slice(0, 40)}` : ''}`,
      html,
    };
    if (cleanEmail) sendPayload.replyTo = cleanEmail;

    const { error: sendError } = await resend.emails.send(sendPayload);

    if (sendError) throw sendError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Contact API error:', err);
    return new Response(JSON.stringify({ success: false, message: 'Failed to send. Please email directly.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
