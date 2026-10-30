-- Shared IP blocklist + form event log for every site on this project.
-- Apply once on the Hoppy Tech Supabase project.

CREATE SCHEMA IF NOT EXISTS security;

CREATE TABLE IF NOT EXISTS security.ip_blocks (
  ip text PRIMARY KEY,
  reason text NOT NULL,
  source_site text,
  strike_count integer NOT NULL DEFAULT 1 CHECK (strike_count >= 1),
  blocked_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ip_blocks_active_idx
  ON security.ip_blocks (blocked_until DESC)
  WHERE blocked_until > now();

CREATE TABLE IF NOT EXISTS security.form_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site text NOT NULL,
  ip text NOT NULL,
  event_type text NOT NULL
    CHECK (event_type IN (
      'attempt',
      'rate_limited',
      'prefilter_reject',
      'ai_reject',
      'ai_review',
      'accept',
      'blocked'
    )),
  category text,
  confidence integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS form_events_site_ip_created_idx
  ON security.form_events (site, ip, created_at DESC);

CREATE INDEX IF NOT EXISTS form_events_ip_created_idx
  ON security.form_events (ip, created_at DESC);

ALTER TABLE security.ip_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.form_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SCHEMA security FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA security FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA security FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA security TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA security TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA security TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA security
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA security
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;

-- Keep every existing tenant schema; add security + krush if missing.
ALTER ROLE authenticator SET pgrst.db_schemas =
  'public, hoppy_tech, cornerstone_coatings, illuminated, bella_portfolio, joshua_firm, otp, watch_luxury, krush, security';

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
