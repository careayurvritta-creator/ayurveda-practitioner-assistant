import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(() => {
  return new Response(JSON.stringify({ ok: true, version: '0.0.0' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
