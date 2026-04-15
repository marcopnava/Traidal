// Vercel serverless endpoint that records demo access events.
// Output is written to stdout and is visible under Vercel → Project → Logs.
//
// PRIVACY: we never log passwords. Only: event type, email, timestamp, and
// geo data (country/city/region) that Vercel already derives from the IP.

type Body = { type?: 'signin' | 'signup'; email?: string };

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  const body: Body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  const headers = req.headers || {};
  const ip = (headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    || (headers['x-real-ip'] as string | undefined) || 'unknown';

  const event = {
    at: new Date().toISOString(),
    type: body.type || 'signin',
    email: body.email || 'unknown',
    country: (headers['x-vercel-ip-country'] as string | undefined) || 'unknown',
    city: decodeURIComponent((headers['x-vercel-ip-city'] as string | undefined) || 'unknown'),
    region: (headers['x-vercel-ip-country-region'] as string | undefined) || 'unknown',
    ip,
    userAgent: (headers['user-agent'] as string | undefined) || 'unknown',
    referer: (headers['referer'] as string | undefined) || '',
  };

  console.log('[ACCESS]', JSON.stringify(event));
  res.status(200).json({ ok: true });
}
