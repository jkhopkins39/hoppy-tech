-- Optional contact fields + phone column
ALTER TABLE hoppy_tech.contact_submissions
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN problem DROP NOT NULL;

ALTER TABLE hoppy_tech.contact_submissions
  ADD COLUMN IF NOT EXISTS phone text;

-- Expose hoppy_tech schema to Supabase API roles
GRANT USAGE ON SCHEMA hoppy_tech TO anon, authenticated, service_role;

GRANT SELECT, UPDATE, DELETE ON hoppy_tech.contact_submissions TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON hoppy_tech.contact_submissions TO service_role;

GRANT SELECT, UPDATE, DELETE ON hoppy_tech.chat_sessions TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON hoppy_tech.chat_sessions TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA hoppy_tech
  GRANT SELECT, UPDATE, DELETE ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA hoppy_tech
  GRANT INSERT, SELECT, UPDATE, DELETE ON TABLES TO service_role;
