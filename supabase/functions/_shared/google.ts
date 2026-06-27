const CLIENT_ID = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
const CLIENT_SECRET = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET');

export async function exchangeRefreshToken(refreshToken: string) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Google OAuth client credentials are not configured');
  }
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Google token exchange failed: ${res.status} ${text}`);
    (err as any).status = res.status;
    throw err;
  }
  const data = await res.json();
  return {
    access_token: data.access_token as string,
    expires_at: Date.now() + (data.expires_in as number) * 1000,
  };
}
