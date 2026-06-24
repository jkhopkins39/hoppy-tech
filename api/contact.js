import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
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
    email = '',
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

  if (!email || !EMAIL_RE.test(String(email)) || !problem?.trim()) {
    return new Response(JSON.stringify({ success: false, message: 'Valid email and project description are required.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (String(problem).length > 5000 || String(email).length > 254) {
    return new Response(JSON.stringify({ success: false, message: 'Input too long.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.VITE_SUPABASE_SECRET_KEY;
  if (supabaseUrl && serviceKey) {
    const sb = createClient(supabaseUrl, serviceKey, {
      db: { schema: 'hoppy_tech' },
      auth: { persistSession: false },
    });
    const { error: dbError } = await sb.from('contact_submissions').insert({
      email: String(email).trim().slice(0, 254),
      name: name ? String(name).slice(0, 120) : null,
      company: company ? String(company).slice(0, 120) : null,
      project_type: project_type ? String(project_type).slice(0, 120) : null,
      problem: String(problem).slice(0, 5000),
      timeline: timeline ? String(timeline).slice(0, 120) : null,
      budget: budget ? String(budget).slice(0, 120) : null,
    });
    if (dbError) console.error('Supabase insert error:', dbError);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const row = (label, value) =>
    value ? `<tr>
      <td style="padding:8px 0;color:#6b7280;width:150px;vertical-align:top;font-size:13px;">${label}</td>
      <td style="padding:8px 0;color:#111827;font-size:14px;">${value}</td>
    </tr>` : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e;">
      <div style="background:#0a0f2e;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
        <img src="https://hoppytech.com/WebsiteLogo.png" alt="Hoppy Tech" height="48"
             style="display:inline-block;margin-bottom:12px;" />
        <div style="color:#7dd3fc;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">New Project Inquiry</div>
      </div>

      <div style="background:#f8fafc;padding:36px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          ${row('From', `<strong>${String(name || 'Anonymous').slice(0, 120)}</strong> &lt;${String(email).slice(0, 254)}&gt;`)}
          ${row('Company', String(company).slice(0, 120))}
          ${row('Project Type', String(project_type).slice(0, 120))}
          ${row('Timeline', String(timeline).slice(0, 120))}
          ${row('Budget', String(budget).slice(0, 120))}
        </table>

        <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">
            What they need solved
          </p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;white-space:pre-wrap;">${String(problem).slice(0, 5000)}</p>
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

    const { error: sendError } = await resend.emails.send({
      from: 'Hoppy Tech Intake <hello@hoppytech.com>',
      to,
      replyTo: String(email).trim(),
      subject: `New Project Inquiry${project_type ? ` — ${String(project_type).slice(0, 60)}` : ''}${name ? ` from ${String(name).slice(0, 40)}` : ''}`,
      html,
    });

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
