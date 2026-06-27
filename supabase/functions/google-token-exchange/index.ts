import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { exchangeRefreshToken } from '../_shared/google.ts';

serve(async (req: Request) => {
  try {
    const { refresh_token } = await req.json();
    const result = await exchangeRefreshToken(refresh_token);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const status = err.status ?? 500;
    return new Response(JSON.stringify({ error: err.message }), { status, headers: { 'Content-Type': 'application/json' } });
  }
});
