// Vercel serverless function: exchanges a PayPal OAuth code for an access token,
// then fetches the user's OpenID profile (email, name, picture).

type Body = { code?: string; redirect_uri?: string };

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const env = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox';
  if (!clientId || !clientSecret) {
    res.status(500).json({ error: 'PayPal is not configured on the server.' });
    return;
  }

  const body: Body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { code, redirect_uri } = body;
  if (!code || !redirect_uri) { res.status(400).json({ error: 'Missing code or redirect_uri' }); return; }

  const apiBase = env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri }),
    });
    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      res.status(502).json({ error: `Token exchange failed: ${txt}` });
      return;
    }
    const token = await tokenRes.json() as { access_token: string };

    const userRes = await fetch(`${apiBase}/v1/identity/openidconnect/userinfo?schema=openid`, {
      headers: { 'Authorization': `Bearer ${token.access_token}`, 'Accept': 'application/json' },
    });
    if (!userRes.ok) {
      const txt = await userRes.text();
      res.status(502).json({ error: `Profile fetch failed: ${txt}` });
      return;
    }
    const info = await userRes.json() as { email?: string; name?: string; picture?: string };
    res.status(200).json({ profile: { email: info.email, name: info.name, picture: info.picture } });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Unexpected error' });
  }
}
