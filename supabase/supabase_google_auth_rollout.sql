-- Google-first Supabase Auth rollout
-- Purpose:
-- 1. Complete the Google migration path first
-- 2. Enable UUID ownership for write operations
-- 3. Keep public reads open during the transition
--
-- Run order:
-- 1. Run supabase_auth_migration_plan.sql first
-- 2. Verify Google users are being linked into public.users.auth_user_id
-- 3. Run this file

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
END $$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycling_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_info_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper indexes for auth-based ownership checks
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_email_not_null
  ON public.users (email)
  WHERE email IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Drop existing conflicting policies if they exist
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS users_select_public ON public.users;
DROP POLICY IF EXISTS users_insert_self ON public.users;
DROP POLICY IF EXISTS users_update_self ON public.users;

DROP POLICY IF EXISTS cycling_events_select_public ON public.cycling_events;
DROP POLICY IF EXISTS cycling_events_insert_self ON public.cycling_events;
DROP POLICY IF EXISTS cycling_events_update_self ON public.cycling_events;
DROP POLICY IF EXISTS cycling_events_delete_self ON public.cycling_events;

DROP POLICY IF EXISTS ride_templates_select_public ON public.ride_templates;
DROP POLICY IF EXISTS ride_templates_insert_self ON public.ride_templates;
DROP POLICY IF EXISTS ride_templates_update_self ON public.ride_templates;
DROP POLICY IF EXISTS ride_templates_delete_self ON public.ride_templates;

DROP POLICY IF EXISTS route_info_templates_select_public ON public.route_info_templates;
DROP POLICY IF EXISTS route_info_templates_insert_self ON public.route_info_templates;
DROP POLICY IF EXISTS route_info_templates_update_self ON public.route_info_templates;
DROP POLICY IF EXISTS route_info_templates_delete_self ON public.route_info_templates;

DROP POLICY IF EXISTS spot_templates_select_public ON public.spot_templates;
DROP POLICY IF EXISTS spot_templates_insert_self ON public.spot_templates;
DROP POLICY IF EXISTS spot_templates_update_self ON public.spot_templates;
DROP POLICY IF EXISTS spot_templates_delete_self ON public.spot_templates;

DROP POLICY IF EXISTS notes_templates_select_public ON public.notes_templates;
DROP POLICY IF EXISTS notes_templates_insert_self ON public.notes_templates;
DROP POLICY IF EXISTS notes_templates_update_self ON public.notes_templates;
DROP POLICY IF EXISTS notes_templates_delete_self ON public.notes_templates;

DROP POLICY IF EXISTS saved_routes_select_public ON public.saved_routes;
DROP POLICY IF EXISTS saved_routes_insert_self ON public.saved_routes;
DROP POLICY IF EXISTS saved_routes_update_self ON public.saved_routes;
DROP POLICY IF EXISTS saved_routes_delete_self ON public.saved_routes;

DROP POLICY IF EXISTS user_verifications_select_owner ON public.user_verifications;
DROP POLICY IF EXISTS user_verifications_insert_owner ON public.user_verifications;
DROP POLICY IF EXISTS user_verifications_update_owner ON public.user_verifications;
DROP POLICY IF EXISTS user_verifications_delete_owner ON public.user_verifications;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

CREATE POLICY users_select_public
ON public.users
FOR SELECT
USING (true);

CREATE POLICY users_insert_self
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY users_update_self
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- ---------------------------------------------------------------------------
-- cycling_events
-- ---------------------------------------------------------------------------

CREATE POLICY cycling_events_select_public
ON public.cycling_events
FOR SELECT
USING (true);

CREATE POLICY cycling_events_insert_self
ON public.cycling_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_auth_user_id);

CREATE POLICY cycling_events_update_self
ON public.cycling_events
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_auth_user_id)
WITH CHECK (auth.uid() = creator_auth_user_id);

CREATE POLICY cycling_events_delete_self
ON public.cycling_events
FOR DELETE
TO authenticated
USING (auth.uid() = creator_auth_user_id);

-- ---------------------------------------------------------------------------
-- Shared ownership policy pattern
-- ---------------------------------------------------------------------------

CREATE POLICY ride_templates_select_public
ON public.ride_templates
FOR SELECT
USING (true);

CREATE POLICY ride_templates_insert_self
ON public.ride_templates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_auth_user_id);

CREATE POLICY ride_templates_update_self
ON public.ride_templates
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_auth_user_id)
WITH CHECK (auth.uid() = creator_auth_user_id);

CREATE POLICY ride_templates_delete_self
ON public.ride_templates
FOR DELETE
TO authenticated
USING (auth.uid() = creator_auth_user_id);

CREATE POLICY route_info_templates_select_public
ON public.route_info_templates
FOR SELECT
USING (true);

CREATE POLICY route_info_templates_insert_self
ON public.route_info_templates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_auth_user_id);

CREATE POLICY route_info_templates_update_self
ON public.route_info_templates
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_auth_user_id)
WITH CHECK (auth.uid() = creator_auth_user_id);

CREATE POLICY route_info_templates_delete_self
ON public.route_info_templates
FOR DELETE
TO authenticated
USING (auth.uid() = creator_auth_user_id);

CREATE POLICY spot_templates_select_public
ON public.spot_templates
FOR SELECT
USING (true);

CREATE POLICY spot_templates_insert_self
ON public.spot_templates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_auth_user_id);

CREATE POLICY spot_templates_update_self
ON public.spot_templates
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_auth_user_id)
WITH CHECK (auth.uid() = creator_auth_user_id);

CREATE POLICY spot_templates_delete_self
ON public.spot_templates
FOR DELETE
TO authenticated
USING (auth.uid() = creator_auth_user_id);

CREATE POLICY notes_templates_select_public
ON public.notes_templates
FOR SELECT
USING (true);

CREATE POLICY notes_templates_insert_self
ON public.notes_templates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_auth_user_id);

CREATE POLICY notes_templates_update_self
ON public.notes_templates
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_auth_user_id)
WITH CHECK (auth.uid() = creator_auth_user_id);

CREATE POLICY notes_templates_delete_self
ON public.notes_templates
FOR DELETE
TO authenticated
USING (auth.uid() = creator_auth_user_id);

CREATE POLICY saved_routes_select_public
ON public.saved_routes
FOR SELECT
USING (true);

CREATE POLICY saved_routes_insert_self
ON public.saved_routes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_auth_user_id);

CREATE POLICY saved_routes_update_self
ON public.saved_routes
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_auth_user_id)
WITH CHECK (auth.uid() = creator_auth_user_id);

CREATE POLICY saved_routes_delete_self
ON public.saved_routes
FOR DELETE
TO authenticated
USING (auth.uid() = creator_auth_user_id);

-- ---------------------------------------------------------------------------
-- user_verifications
-- ---------------------------------------------------------------------------

CREATE POLICY user_verifications_select_owner
ON public.user_verifications
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

CREATE POLICY user_verifications_insert_owner
ON public.user_verifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY user_verifications_update_owner
ON public.user_verifications
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY user_verifications_delete_owner
ON public.user_verifications
FOR DELETE
TO authenticated
USING (auth.uid() = auth_user_id);

COMMIT;

-- ---------------------------------------------------------------------------
-- Post-run verification queries
-- ---------------------------------------------------------------------------
-- Google-linked public.users rows:
-- select id, auth_user_id, google_sub, email
-- from public.users
-- where google_sub is not null
-- order by updated_at desc
-- limit 20;
--
-- Remaining Google legacy rows not linked to auth.users:
-- select count(*)
-- from public.users
-- where google_sub is not null
--   and auth_user_id is null;
--
-- Remaining content rows without UUID ownership:
-- select count(*) from public.cycling_events where creator_id is not null and creator_auth_user_id is null;
-- select count(*) from public.saved_routes where creator_id is not null and creator_auth_user_id is null;
