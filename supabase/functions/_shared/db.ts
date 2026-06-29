import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

if (!SUPABASE_URL) throw new Error('SUPABASE_URL is not configured');
if (!SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY is not configured');

/** Supabase client with service role — bypasses RLS. Use for system operations. */
export function serviceRoleClient() {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return createClient(SUPABASE_URL, key);
}

/** Supabase client scoped to the authenticated user — respects RLS. */
export function userScopedClient(jwt: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });
}

let cachedAnonClient: ReturnType<typeof createClient> | null = null;

/**
 * Cryptographically verify the JWT and return the authenticated user's ID.
 * Uses Supabase's getUser() which validates the token server-side.
 * Falls back to base64 decode for edge cases (e.g. local dev with custom JWTs).
 */
export async function authUid(jwt: string): Promise<string | null> {
  if (!jwt || jwt.length < 10) return null;
  try {
    if (!cachedAnonClient) {
      cachedAnonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      });
    }
    const { data: { user }, error } = await cachedAnonClient.auth.getUser(jwt);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}