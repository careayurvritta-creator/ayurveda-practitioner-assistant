import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder');

export const isSupabaseConfigured = isConfigured;

export type SupabaseUser = User;

// Google Drive refresh token stored in localStorage
const GOOGLE_REFRESH_TOKEN_KEY = 'google_refresh_token';

export function getStoredGoogleRefreshToken(): string | null {
  return localStorage.getItem(GOOGLE_REFRESH_TOKEN_KEY);
}

export function storeGoogleRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(GOOGLE_REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(GOOGLE_REFRESH_TOKEN_KEY);
  }
}

export async function exchangeGoogleRefreshToken(refreshToken: string): Promise<{ access_token: string; expires_at: number }> {
  const { data, error } = await supabase.functions.invoke('google-token-exchange', {
    body: { refresh_token: refreshToken },
  });
  if (error) throw error;
  if (!data || !data.access_token) {
    throw new Error('Invalid response from google-token-exchange');
  }
  return data;
}

export async function getGoogleAccessToken(): Promise<string | null> {
  const refreshToken = getStoredGoogleRefreshToken();
  if (!refreshToken) return null;
  try {
    const result = await exchangeGoogleRefreshToken(refreshToken);
    return result.access_token;
  } catch {
    // If exchange fails, clear token and let caller re-auth
    storeGoogleRefreshToken(null);
    return null;
  }
}
