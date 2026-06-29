/**
 * Shared CORS configuration for all edge functions.
 * In production, restrict to your domain(s). For local dev, allow all.
 */

const PROD_ORIGINS = [
  'https://careayurvritta.com',
  'https://www.careayurvritta.com',
  'https://ayurveda-practitioner-assistant.vercel.app',
  'https://assistant.ayurvrittaayurveda.in',
];

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin');
  const isDev = Deno.env.get('DENO_ENV') !== 'production';

  if (isDev) return '*';
  if (origin && PROD_ORIGINS.includes(origin)) return origin;
  return PROD_ORIGINS[0]; // fallback to primary domain
}

export function corsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-supabase-auth',
    'Access-Control-Max-Age': '86400',
  };
}

export function corsPreflightResponse(req: Request): Response {
  return new Response(null, { headers: corsHeaders(req) });
}

export function jsonResponse(req: Request, data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

export function errorResponse(req: Request, message: string, status = 500): Response {
  return jsonResponse(req, { error: message }, status);
}
