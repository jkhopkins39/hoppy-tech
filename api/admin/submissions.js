import { verifyAdminToken, getBearerToken } from '../_lib/auth.js';
import { jsonResponse } from '../_lib/json.js';
import { getSupabaseHoppyAdmin } from '../_lib/supabase-admin.js';

export const config = { runtime: 'edge' };

const METHODS = 'GET, PATCH, DELETE, OPTIONS';

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
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('admin submissions list error:', error);
      return jsonResponse({ error: 'Failed to load submissions' }, 500, req, METHODS);
    }

    return jsonResponse({ submissions: data ?? [] }, 200, req, METHODS);
  }

  if (req.method === 'PATCH') {
    const body = await req.json().catch(() => null);
    const id = body?.id;
    if (!id) return jsonResponse({ error: 'Missing submission id' }, 400, req, METHODS);

    const updates = {};
    if (typeof body.read === 'boolean') updates.read = body.read;

    if (!Object.keys(updates).length) {
      return jsonResponse({ error: 'Nothing to update' }, 400, req, METHODS);
    }

    const { data, error } = await sb
      .from('contact_submissions')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('admin submissions patch error:', error);
      return jsonResponse({ error: 'Failed to update submission' }, 500, req, METHODS);
    }

    return jsonResponse({ submission: data }, 200, req, METHODS);
  }

  if (req.method === 'DELETE') {
    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];

    if (!ids.length) {
      return jsonResponse({ error: 'Missing submission id(s)' }, 400, req, METHODS);
    }

    const { error } = await sb.from('contact_submissions').delete().in('id', ids);

    if (error) {
      console.error('admin submissions delete error:', error);
      return jsonResponse({ error: 'Failed to delete submission(s)' }, 500, req, METHODS);
    }

    return jsonResponse({ success: true }, 200, req, METHODS);
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, req, METHODS);
}
