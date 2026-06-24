import { verifyAdminToken, getBearerToken } from '../_lib/auth.js';
import { jsonResponse } from '../_lib/json.js';
import { getSupabaseHoppyAdmin } from '../_lib/supabase-admin.js';

export const config = { runtime: 'edge' };

const METHODS = 'GET, DELETE, OPTIONS';

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return jsonResponse(null, 204, req, METHODS);
  }

  if (!(await verifyAdminToken(getBearerToken(req)))) {
    return jsonResponse({ error: 'Unauthorized' }, 401, req, METHODS);
  }

  const sb = getSupabaseHoppyAdmin();
  if (!sb) {
    return jsonResponse({ error: 'Database not configured' }, 503, req, METHODS);
  }

  if (req.method === 'GET') {
    const { data, error } = await sb
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('admin chat-sessions list error:', error);
      return jsonResponse({ error: 'Failed to load conversations' }, 500, req, METHODS);
    }

    return jsonResponse({ sessions: data ?? [] }, 200, req, METHODS);
  }

  if (req.method === 'DELETE') {
    const body = await req.json().catch(() => ({}));
    const id = body?.id;
    if (!id) return jsonResponse({ error: 'Missing session id' }, 400, req, METHODS);

    const { error } = await sb.from('chat_sessions').delete().eq('id', id);

    if (error) {
      console.error('admin chat-sessions delete error:', error);
      return jsonResponse({ error: 'Failed to delete conversation' }, 500, req, METHODS);
    }

    return jsonResponse({ success: true }, 200, req, METHODS);
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, req, METHODS);
}
