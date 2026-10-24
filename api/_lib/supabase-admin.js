import { createClient } from '@supabase/supabase-js';
import { getSupabaseSecretKey, getSupabaseUrl } from './env.js';

/** Service-role client for hoppy_tech schema tables (contact_submissions, chat_sessions, google_leads). */
export function getSupabaseHoppyAdmin() {
  const url = getSupabaseUrl();
  const key = getSupabaseSecretKey();

  if (!url || !key) return null;

  return createClient(url, key, {
    db: { schema: 'hoppy_tech' },
    auth: { persistSession: false },
  });
}
