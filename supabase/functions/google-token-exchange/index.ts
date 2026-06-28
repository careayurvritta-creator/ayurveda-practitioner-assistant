import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { exchangeRefreshToken } from '../_shared/google.ts';
import { authUid } from '../_shared/db.ts';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const userId = authUid(jwt);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { refresh_token } = body;

    if (!refresh_token || typeof refresh_token !== 'string') {
      return new Response(JSON.stringify({ error: 'refresh_token is required' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const result = await exchangeRefreshToken(refresh_token);
    return new Response(JSON.stringify(result), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const status = err.status ?? 500;
    return new Response(JSON.stringify({ error: 'Token exchange failed' }), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
