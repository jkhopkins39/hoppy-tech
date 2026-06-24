import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Schema-scoped client for hoppytech-specific tables.
// Auth session is shared via localStorage (same project URL).
export const supabaseHoppy = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: 'hoppy_tech' },
      auth: {
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;
