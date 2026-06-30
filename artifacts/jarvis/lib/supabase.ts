import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const JARVIS_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/Jarvis-chat`;

// Free trial config — preserved exactly from original
export const FREE_LIMIT = 5;
export const RESET_MS = 8 * 60 * 60 * 1000; // 8 hours

type SupabaseClient = ReturnType<typeof createClient<Database>>;

// Singleton typed Supabase client for browser usage
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}
