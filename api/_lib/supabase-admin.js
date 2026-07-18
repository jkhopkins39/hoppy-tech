import { createClient } from '@supabase/supabase-js';

/** Service-role client for hoppy_tech schema tables (contact_submissions, chat_sessions, google_leads). */
export function getSupabaseHoppyAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.VITE_SUPABASE_SECRET_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    db: { schema: 'hoppy_tech' },
    auth: { persistSession: false },
  });
}
