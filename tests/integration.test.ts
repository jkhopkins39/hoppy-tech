/**
 * Hoppy Tech portal — integration tests
 *
 * Requires env vars:
 *   HT_SUPABASE_PROJECT_URL, HT_SUPABASE_PUBLISHABLE_KEY  → Supabase portal auth
 *
 * Run:  npx vitest run tests/integration.test.ts
 */

import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.HT_SUPABASE_PROJECT_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.HT_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;
const supabaseConfigured = !!(supabaseUrl && supabaseKey);
const itSupabase = supabaseConfigured ? it : it.skip;

// ─── Portal logic (pure functions — no env needed) ────────────────────────────
describe("portal TENANTS config", () => {
  it("all expected tenants are defined", async () => {
    const { TENANTS } = await import("../src/lib/portal.ts");
    const expectedKeys = [
      "cornerstone", "otp", "illuminated", "bells",
      "watch_luxury", "joshua_firm", "krush",
    ];
    for (const key of expectedKeys) {
      expect(TENANTS).toHaveProperty(key);
      expect(TENANTS[key].callbackUrl).toBeTruthy();
    }
  });

  it("getTenantConfig returns null for unknown tenant", async () => {
    const { getTenantConfig } = await import("../src/lib/portal.ts");
    expect(getTenantConfig("nonexistent_tenant")).toBeNull();
  });

  it("buildCallbackUrl includes tokens in the URL", async () => {
    const { TENANTS, buildCallbackUrl } = await import("../src/lib/portal.ts");
    const tenant = TENANTS.cornerstone;
    const url = buildCallbackUrl(tenant, "access_token_abc", "refresh_token_xyz");
    expect(url).toContain("access_token_abc");
    expect(url).toContain("refresh_token_xyz");
  });
});

// ─── Supabase auth ────────────────────────────────────────────────────────────
describe("Supabase portal auth", () => {
  itSupabase("anon client can reach the auth endpoint", async () => {
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { data, error } = await supabase.auth.getSession();
    expect(error).toBeNull();
    expect(data).toHaveProperty("session");
  });

  itSupabase("rejects invalid credentials", async () => {
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { error } = await supabase.auth.signInWithPassword({
      email: "nobody@example.com",
      password: "wrong_password_9999",
    });
    expect(error).not.toBeNull();
  });
});

// ─── Known issue reminder ─────────────────────────────────────────────────────
it("KNOWN ISSUE: Contact.tsx uses Web3Forms, not Resend", () => {
  // src/routes/Contact.tsx line ~117 calls https://api.web3forms.com/submit
  // Fix: add api/contact.js Vercel serverless function (same pattern as joshua-firm)
  // Then update Contact.tsx to POST to /api/contact instead.
  expect(true).toBe(true);
});
