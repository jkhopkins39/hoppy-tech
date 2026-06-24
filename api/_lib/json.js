import { getEdgeCorsHeaders } from '../_lib/cors.js';

export function jsonResponse(body, status, req, methods = 'GET, PATCH, DELETE, OPTIONS') {
  const headers = getEdgeCorsHeaders(req, methods);

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}
