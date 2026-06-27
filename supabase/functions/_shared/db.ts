import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

export function serviceRoleClient() {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(SUPABASE_URL, key);
}

export function userScopedClient(jwt: string) {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  return createClient(SUPABASE_URL, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });
}

export function authUid(jwt: string): string | null {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}