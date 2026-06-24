-- Remove permissive policies
DROP POLICY IF EXISTS "anon select" ON hoppy_tech.contact_submissions;
DROP POLICY IF EXISTS "anon update" ON hoppy_tech.contact_submissions;
DROP POLICY IF EXISTS "anon delete" ON hoppy_tech.contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can read" ON hoppy_tech.chat_sessions;

REVOKE ALL ON hoppy_tech.contact_submissions FROM anon;
REVOKE ALL ON hoppy_tech.chat_sessions FROM anon;

GRANT SELECT, UPDATE, DELETE ON hoppy_tech.contact_submissions TO authenticated;
GRANT SELECT, UPDATE, DELETE ON hoppy_tech.chat_sessions TO authenticated;

CREATE POLICY "agency_owner_select_submissions" ON hoppy_tech.contact_submissions
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'agency_owner');

CREATE POLICY "agency_owner_update_submissions" ON hoppy_tech.contact_submissions
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'agency_owner')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'agency_owner');

CREATE POLICY "agency_owner_delete_submissions" ON hoppy_tech.contact_submissions
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'agency_owner');

CREATE POLICY "agency_owner_select_chat_sessions" ON hoppy_tech.chat_sessions
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'agency_owner');

CREATE POLICY "agency_owner_update_chat_sessions" ON hoppy_tech.chat_sessions
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'agency_owner')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'agency_owner');

CREATE POLICY "agency_owner_delete_chat_sessions" ON hoppy_tech.chat_sessions
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'agency_owner');
