import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { exchangeRefreshToken } from '../_shared/google.ts';
import { authUid } from '../_shared/db.ts';
import { corsPreflightResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse(req);
  if (req.method !== 'POST') return errorResponse(req, 'Method not allowed', 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse(req, 'Authorization required', 401);

    const jwt = authHeader.replace('Bearer ', '');
    const userId = await authUid(jwt);
    if (!userId) return errorResponse(req, 'Invalid token', 401);

    const body = await req.json();
    const { refresh_token, expected_user_id } = body;

    if (!refresh_token || typeof refresh_token !== 'string') {
      return errorResponse(req, 'refresh_token is required', 400);
    }

    // Verify token ownership: caller must claim ownership of this refresh token
    if (expected_user_id && expected_user_id !== userId) {
      return errorResponse(req, 'Token ownership mismatch', 403);
    }

    const result = await exchangeRefreshToken(refresh_token);
    return jsonResponse(req, result);
  } catch (err: any) {
    const status = err.status ?? 500;
    return errorResponse(req, 'Token exchange failed', status);
  }
});
