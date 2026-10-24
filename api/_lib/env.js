/**
 * Hoppy Tech env accessors. Prefer HT_* shared Vercel names; fall back to
 * legacy names so local .env files keep working until updated.
 */

export function getSupabaseUrl() {
  return (
    process.env.HT_SUPABASE_PROJECT_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  );
}

export function getSupabaseSecretKey() {
  return (
    process.env.HT_SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.VITE_SUPABASE_SECRET_KEY ||
    ''
  );
}

export function getSupabasePublishableKey() {
  return (
    process.env.HT_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    ''
  );
}

export function getResendApiKey() {
  return process.env.HT_RESEND_API_KEY || process.env.RESEND_API_KEY || '';
}

export function getGeminiApiKey() {
  return (
    process.env.HT_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  );
}

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'jeremy@hoppytech.com';
}
