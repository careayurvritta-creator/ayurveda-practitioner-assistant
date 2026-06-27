import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { searchCorpus } from '../_shared/corpus.ts';

serve(async (req: Request) => {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  const matches = searchCorpus(q);
  return new Response(JSON.stringify({ matches }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
