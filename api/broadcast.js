import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { getEdgeCorsHeaders } from './_lib/cors.js';

export const config = { runtime: 'edge' };

const CLIENT_EMAILS = [
  { name: 'Cornerstone Coatings',      email: '' },
  { name: 'One Talent Productions',    email: 'onetalentproductions@gmail.com' },
  { name: 'Illuminated Productions',   email: '' },
  { name: 'Joshua 1:9 Law Firm',       email: 'thejoshua19lawfirm@gmail.com' },
  { name: 'SXNCTUARY',                 email: '' },
  { name: "Bell's Southern Creations", email: '' },
  { name: 'Watch Trading Post',        email: '' },
];

export default async function handler(req) {
  const corsHeaders = getEdgeCorsHeaders(req, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // Verify the caller is an authenticated agency_owner
  const authHeader = req.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '');
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user || user.app_metadata?.role !== 'agency_owner') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { subject, message } = await req.json();
  if (!subject?.trim() || !message?.trim()) {
    return new Response(JSON.stringify({ error: 'Subject and message are required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const recipients = CLIENT_EMAILS.filter(c => c.email);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e;">
      <div style="background:#0a0f2e;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
        <img src="https://hoppytech.com/WebsiteLogo.png" alt="Hoppy Tech" height="48"
             style="display:inline-block;margin-bottom:12px;" />
        <div style="color:#7dd3fc;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">
          Client Notice
        </div>
      </div>

      <div style="background:#f8fafc;padding:36px 32px;">
        <h1 style="margin:0 0 20px;font-size:22px;color:#0a0f2e;">${subject}</h1>
        <div style="font-size:15px;line-height:1.7;color:#374151;white-space:pre-wrap;">${message}</div>
      </div>

      <div style="background:#e0f2fe;padding:20px 32px;border-radius:0 0 12px 12px;text-align:center;">
        <p style="margin:0;font-size:13px;color:#0369a1;">
          Sent by <strong>Jeremy Hopkins</strong> · Hoppy Tech<br/>
          <a href="mailto:jeremyyhop@gmail.com" style="color:#0369a1;">jeremyyhop@gmail.com</a>
          &nbsp;·&nbsp;
          <a href="https://hoppytech.com" style="color:#0369a1;">hoppytech.com</a>
        </p>
      </div>
    </div>
  `;

  const results = await Promise.allSettled(
    recipients.map(client =>
      resend.emails.send({
        from: 'Jeremy @ Hoppy Tech <hello@hoppytech.com>',
        to: client.email,
        subject,
        html,
      })
    )
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return new Response(
    JSON.stringify({ sent, failed, total: recipients.length }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
