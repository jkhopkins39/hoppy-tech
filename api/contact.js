import { applyCors } from './_lib/cors.js';
import { getClientIp, rateLimit } from './_lib/rateLimit.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    return res.status(429).json({ success: false, message: 'Too many submissions. Please try again later.' });
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    return res.status(500).json({ success: false, message: 'Contact form is not configured' });
  }

  try {
    const {
      email,
      name = '',
      subject_line: subjectLine = '',
      message,
      contact_website: honeypot1 = '',
      contact_fax: honeypot2 = '',
    } = req.body ?? {};

    if (honeypot1 || honeypot2) {
      return res.status(200).json({ success: true });
    }

    if (!email || !message || !EMAIL_RE.test(String(email))) {
      return res.status(400).json({ success: false, message: 'Valid email and message are required' });
    }

    if (String(message).length > 5000 || String(email).length > 254) {
      return res.status(400).json({ success: false, message: 'Message is too long' });
    }

    const subject = subjectLine
      ? `New Contact: ${String(subjectLine).slice(0, 120)}`
      : 'New Contact Form Submission';

    const web3Response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        email: String(email).trim(),
        name: String(name).trim().slice(0, 120),
        subject,
        message: String(message).trim(),
      }),
    });

    const result = await web3Response.json();
    if (!web3Response.ok || !result.success) {
      return res.status(502).json({ success: false, message: 'Failed to send message' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Contact API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
