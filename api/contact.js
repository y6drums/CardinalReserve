// Vercel serverless function — POST /api/contact
// Sends the contact form as an email to contact@thecardinalreserve.com via Resend.
// Requires env var RESEND_API_KEY set in Vercel project settings.

const TO = 'contact@thecardinalreserve.com';
const FROM = 'Cardinal Reserve <noreply@thecardinalreserve.com>';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function renderRows(fields) {
  const rows = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v == null || v === '') continue;
    rows.push(
      `<tr><td style="padding:6px 12px 6px 0;color:#666;font-weight:600;text-transform:capitalize;vertical-align:top;">${esc(k)}</td>` +
      `<td style="padding:6px 0;white-space:pre-wrap;">${esc(v)}</td></tr>`
    );
  }
  return rows.join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(500).json({ error: 'Email service not configured' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Missing body' });

  // Basic honeypot
  if (body.website) return res.status(200).json({ ok: true });

  const inquiry = (body.inquiry || 'inquiry').toString();
  const name = (body.name || '').toString().trim();
  const email = (body.email || '').toString().trim();

  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  const subject = `Cardinal Reserve — ${inquiry} inquiry from ${name}`;
  const html =
    `<div style="font-family:system-ui,-apple-system,sans-serif;color:#1f1b1a;">` +
    `<h2 style="margin:0 0 12px;font-family:Georgia,serif;">New ${esc(inquiry)} inquiry</h2>` +
    `<table style="border-collapse:collapse;font-size:14px;">${renderRows(body)}</table>` +
    `</div>`;

  const text = Object.entries(body)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const payload = { from: FROM, to: [TO], subject, html, text };
  if (EMAIL_RE.test(email)) payload.reply_to = email;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('Resend error:', r.status, detail);
      return res.status(502).json({ error: 'Email service rejected the request' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Send failed:', err);
    return res.status(500).json({ error: 'Send failed' });
  }
}
