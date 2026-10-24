import { createClient } from '@supabase/supabase-js';
import { getSupabaseSecretKey, getSupabaseUrl } from './env.js';

let adminClient = null;

export function isAgencyOwner(user) {
  return user?.app_metadata?.role === 'agency_owner';
}

function getSupabaseAdmin() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseSecretKey();

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase service role is not configured');
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

export function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (header) return header;
  if (req.headers?.get) return req.headers.get('authorization') || req.headers.get('Authorization') || '';
  return '';
}

export async function verifyAdminToken(authHeader) {
  const token = String(authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return false;
    return isAgencyOwner(user);
  } catch {
    return false;
  }
}
