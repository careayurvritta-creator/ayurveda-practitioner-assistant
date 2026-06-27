import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

export function getSupabaseClient(req: Request) {
  const authHeader = req.headers.get('authorization');
  const jwt = authHeader?.replace('Bearer ', '') ?? '';
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  );
}
