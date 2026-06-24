-- Expose custom schema to PostgREST / supabase-js
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, hoppy_tech';
NOTIFY pgrst, 'reload config';
