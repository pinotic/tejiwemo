import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

function isValidSupabaseConfig(url?: string, key?: string): boolean {
  if (!url || !key) return false;
  if (!url.startsWith('https://') && !url.startsWith('http://')) return false;
  if (url.includes('your-project-id')) return false;
  if (
    key === 'VITE_SUPABASE_ANON_KEY' ||
    key.includes('your-supabase-anon-key') ||
    key.length < 20
  ) {
    return false;
  }
  return true;
}

export const supabaseClient: SupabaseClient | null = isValidSupabaseConfig(
  rawUrl,
  rawAnonKey
)
  ? createClient(rawUrl!, rawAnonKey!)
  : null;
