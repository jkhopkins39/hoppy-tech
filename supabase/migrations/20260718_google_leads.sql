-- Google Ads lead-form webhook ingest
-- Run in Supabase SQL Editor against the Hoppy Tech project.

CREATE TABLE IF NOT EXISTS hoppy_tech.google_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text NOT NULL UNIQUE,
  campaign_id text,
  form_id text,
  full_name text,
  email text,
  phone_number text,
  business_size text,
  -- Optional extras from the webhook payload (useful for follow-up)
  gcl_id text,
  is_test boolean NOT NULL DEFAULT false,
  raw_payload jsonb,
  -- Links to the mirrored row in Messages (contact_submissions), if created
  contact_submission_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS google_leads_created_at_idx
  ON hoppy_tech.google_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS google_leads_email_idx
  ON hoppy_tech.google_leads (email);

ALTER TABLE hoppy_tech.google_leads ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON hoppy_tech.google_leads FROM anon;
GRANT SELECT, UPDATE, DELETE ON hoppy_tech.google_leads TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON hoppy_tech.google_leads TO service_role;

DROP POLICY IF EXISTS "agency_owner_select_google_leads" ON hoppy_tech.google_leads;
DROP POLICY IF EXISTS "agency_owner_update_google_leads" ON hoppy_tech.google_leads;
DROP POLICY IF EXISTS "agency_owner_delete_google_leads" ON hoppy_tech.google_leads;

CREATE POLICY "agency_owner_select_google_leads" ON hoppy_tech.google_leads
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'agency_owner');

CREATE POLICY "agency_owner_update_google_leads" ON hoppy_tech.google_leads
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'agency_owner')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'agency_owner');

CREATE POLICY "agency_owner_delete_google_leads" ON hoppy_tech.google_leads
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'agency_owner');

-- Optional: make source/business size visible on contact inbox rows
ALTER TABLE hoppy_tech.contact_submissions
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS google_lead_id text;
