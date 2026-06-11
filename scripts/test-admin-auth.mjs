/**
 * Admin auth smoke tests.
 * Usage: node scripts/test-admin-auth.mjs [baseUrl]
 * Optional env: SUPABASE_TEST_PASSWORD — runs full sign-in + blog auth check
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '../api/_lib/auth.js';

dotenv.config();

const baseUrl = process.argv[2] || 'http://localhost:3001';
const adminEmail = process.env.ADMIN_EMAIL || 'jeremy@hoppytech.com';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

let passed = 0;
let failed = 0;

function ok(label) {
  passed += 1;
  console.log(`✓ ${label}`);
}

function fail(label, detail = '') {
  failed += 1;
  console.error(`✗ ${label}${detail ? ` — ${detail}` : ''}`);
}

async function testBlogUnauthorized() {
  const res = await fetch(`${baseUrl}/api/blog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'invalid' }),
  });
  if (res.status === 401) ok('POST /api/blog without token returns 401');
  else fail('POST /api/blog without token returns 401', `got ${res.status}`);
}

async function testVerifyInvalidToken() {
  if (!supabaseUrl || !serviceRole) {
    fail('Server Supabase env vars present', 'missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  const valid = await verifyAdminToken('Bearer not-a-real-jwt');
  if (!valid) ok('verifyAdminToken rejects invalid JWT');
  else fail('verifyAdminToken rejects invalid JWT');
}

async function testSupabaseSignInAndBlogAuth() {
  const password = process.env.SUPABASE_TEST_PASSWORD;
  if (!password) {
    console.log('○ Skipping sign-in test (set SUPABASE_TEST_PASSWORD in .env to run)');
    return;
  }
  if (!supabaseUrl || !supabaseAnon) {
    fail('Supabase sign-in env vars present', 'missing SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnon);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password,
  });

  if (error || !data.session?.access_token) {
    fail('Supabase signInWithPassword', error?.message || 'no session');
    return;
  }
  ok('Supabase signInWithPassword succeeds');

  const tokenValid = await verifyAdminToken(`Bearer ${data.session.access_token}`);
  if (tokenValid) ok('verifyAdminToken accepts Supabase access token');
  else fail('verifyAdminToken accepts Supabase access token');

  const res = await fetch(`${baseUrl}/api/blog`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify({ action: 'invalid' }),
  });

  if (res.status === 400) ok('POST /api/blog with valid token passes auth (invalid action → 400)');
  else if (res.status === 401) fail('POST /api/blog with valid token passes auth', 'still 401');
  else fail('POST /api/blog with valid token passes auth', `got ${res.status}`);

  await supabase.auth.signOut();
}

async function main() {
  console.log(`\nAdmin auth tests → ${baseUrl}\n`);

  await testBlogUnauthorized();
  await testVerifyInvalidToken();
  await testSupabaseSignInAndBlogAuth();

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
