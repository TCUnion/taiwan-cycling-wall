-- LINE Supabase Auth rollout
-- Purpose:
-- 1. Verify LINE auth binding is working after Google-first rollout
-- 2. Monitor remaining legacy LINE users without auth_user_id
-- 3. Avoid changing existing production RLS policies a second time
--
-- Run order:
-- 1. Run supabase_auth_migration_plan.sql first
-- 2. Run supabase_google_auth_rollout.sql first
-- 3. Use this file for safety checks and post-run verification

BEGIN;

-- ---------------------------------------------------------------------------
-- Safety checks
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'auth_user_id'
  ) THEN
    RAISE EXCEPTION 'Missing public.users.auth_user_id. Run supabase_auth_migration_plan.sql first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'line_user_id'
  ) THEN
    RAISE EXCEPTION 'Missing public.users.line_user_id. Run supabase_auth_migration_plan.sql first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'users'
      AND c.relrowsecurity = true
  ) THEN
    RAISE EXCEPTION 'public.users RLS is not enabled. Run supabase_google_auth_rollout.sql first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'users_update_self'
  ) THEN
    RAISE EXCEPTION 'Missing users_update_self policy. Run supabase_google_auth_rollout.sql first.';
  END IF;
END $$;

COMMIT;

-- ---------------------------------------------------------------------------
-- Verification queries
-- ---------------------------------------------------------------------------
-- Recently linked LINE users:
-- select id, auth_user_id, line_user_id, auth_provider, name, updated_at
-- from public.users
-- where line_user_id is not null
-- order by updated_at desc
-- limit 20;
--
-- Remaining legacy LINE rows not linked to auth.users:
-- select count(*) as line_users_missing_auth_user_id
-- from public.users
-- where line_user_id is not null
--   and auth_user_id is null;
--
-- Remaining rows detail:
-- select id, auth_user_id, line_user_id, auth_provider, name, updated_at
-- from public.users
-- where line_user_id is not null
--   and auth_user_id is null
-- order by updated_at desc;
--
-- Example check for a specific successful LINE binding:
-- select id, auth_user_id, line_user_id, auth_provider, name, updated_at
-- from public.users
-- where line_user_id = 'U166e0f3a2f4ed0a5d8def1e8f4481b32';
