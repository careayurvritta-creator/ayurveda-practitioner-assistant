import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsPreflightResponse, jsonResponse } from '../_shared/cors.ts';

serve((req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse(req);
  return jsonResponse(req, { ok: true, version: '0.0.1' });
});
