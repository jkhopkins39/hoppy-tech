import { createClient } from '@supabase/supabase-js';

// Injected from HT_* shared Vercel vars via vite.config (not VITE_ prefix).
const supabaseUrl = import.meta.env.HT_SUPABASE_PROJECT_URL as string | undefined;
const supabaseAnonKey = import.meta.env.HT_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.sessionStorage,
        experimental: { passkey: true },
      },
    })
  : null;
