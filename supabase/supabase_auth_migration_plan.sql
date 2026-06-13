-- Supabase Auth migration draft
-- Goal:
-- 1. Move identity source from custom provider IDs to auth.users.id (UUID)
-- 2. Keep existing app data mappable during migration
-- 3. Prepare for strict RLS like "users can only update themselves"

BEGIN;

-- ---------------------------------------------------------------------------
-- Phase 0: Extensions
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Phase 1: Identity mapping layer
-- ---------------------------------------------------------------------------
-- This table links one app user to one or more external identity subjects.
-- It lets us migrate old rows like google-123 / line-456 without overloading
-- public.users with provider-specific logic.

CREATE TABLE IF NOT EXISTS public.user_identity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  provider_subject text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_identity_links_provider_subject_key UNIQUE (provider, provider_subject)
);

CREATE INDEX IF NOT EXISTS idx_user_identity_links_user_id
  ON public.user_identity_links (user_id);

-- ---------------------------------------------------------------------------
-- Phase 2: Prepare public.users for auth-based ownership
-- ---------------------------------------------------------------------------
-- Existing public.users.id is text today, so we do not replace it in-place yet.
-- Instead we introduce a new auth-owned UUID and migrate references gradually.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid,
  ADD COLUMN IF NOT EXISTS legacy_user_id text,
  ADD COLUMN IF NOT EXISTS google_sub text,
  ADD COLUMN IF NOT EXISTS facebook_user_id text,
  ADD COLUMN IF NOT EXISTS line_user_id text,
  ADD COLUMN IF NOT EXISTS strava_athlete_id text;

-- Backfill legacy_user_id for old rows.
UPDATE public.users
SET legacy_user_id = id
WHERE legacy_user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id_unique
  ON public.users (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_legacy_user_id_unique
  ON public.users (legacy_user_id)
  WHERE legacy_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub_unique
  ON public.users (google_sub)
  WHERE google_sub IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_facebook_user_id_unique
  ON public.users (facebook_user_id)
  WHERE facebook_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_line_user_id_unique
  ON public.users (line_user_id)
  WHERE line_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_strava_athlete_id_unique
  ON public.users (strava_athlete_id)
  WHERE strava_athlete_id IS NOT NULL;

-- Parse current custom IDs into provider-specific columns where possible.
UPDATE public.users
SET google_sub = regexp_replace(id, '^google-', '')
WHERE id LIKE 'google-%'
  AND google_sub IS NULL;

UPDATE public.users
SET facebook_user_id = regexp_replace(id, '^fb-', '')
WHERE id LIKE 'fb-%'
  AND facebook_user_id IS NULL;

UPDATE public.users
SET line_user_id = regexp_replace(id, '^line-', '')
WHERE id LIKE 'line-%'
  AND line_user_id IS NULL;

UPDATE public.users
SET strava_athlete_id = regexp_replace(id, '^strava-', '')
WHERE id LIKE 'strava-%'
  AND strava_athlete_id IS NULL;

-- ---------------------------------------------------------------------------
-- Phase 3: Seed identity links from legacy users
-- ---------------------------------------------------------------------------

INSERT INTO public.user_identity_links (user_id, provider, provider_subject, email)
SELECT auth_user_id, 'google', google_sub, email
FROM public.users
WHERE auth_user_id IS NOT NULL
  AND google_sub IS NOT NULL
ON CONFLICT (provider, provider_subject) DO NOTHING;

INSERT INTO public.user_identity_links (user_id, provider, provider_subject, email)
SELECT auth_user_id, 'facebook', facebook_user_id, email
FROM public.users
WHERE auth_user_id IS NOT NULL
  AND facebook_user_id IS NOT NULL
ON CONFLICT (provider, provider_subject) DO NOTHING;

INSERT INTO public.user_identity_links (user_id, provider, provider_subject, email)
SELECT auth_user_id, 'line', line_user_id, email
FROM public.users
WHERE auth_user_id IS NOT NULL
  AND line_user_id IS NOT NULL
ON CONFLICT (provider, provider_subject) DO NOTHING;

INSERT INTO public.user_identity_links (user_id, provider, provider_subject, email)
SELECT auth_user_id, 'strava', strava_athlete_id, email
FROM public.users
WHERE auth_user_id IS NOT NULL
  AND strava_athlete_id IS NOT NULL
ON CONFLICT (provider, provider_subject) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Phase 4: Add parallel UUID ownership columns to dependent tables
-- ---------------------------------------------------------------------------
-- We do not drop old text creator_id/user_id yet. Add new nullable UUID columns
-- so the app can dual-write during rollout.

ALTER TABLE public.cycling_events
  ADD COLUMN IF NOT EXISTS creator_auth_user_id uuid;

ALTER TABLE public.ride_templates
  ADD COLUMN IF NOT EXISTS creator_auth_user_id uuid;

ALTER TABLE public.route_info_templates
  ADD COLUMN IF NOT EXISTS creator_auth_user_id uuid;

ALTER TABLE public.spot_templates
  ADD COLUMN IF NOT EXISTS creator_auth_user_id uuid;

ALTER TABLE public.notes_templates
  ADD COLUMN IF NOT EXISTS creator_auth_user_id uuid;

ALTER TABLE public.saved_routes
  ADD COLUMN IF NOT EXISTS creator_auth_user_id uuid;

ALTER TABLE public.user_verifications
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_cycling_events_creator_auth_user_id
  ON public.cycling_events (creator_auth_user_id);

CREATE INDEX IF NOT EXISTS idx_ride_templates_creator_auth_user_id
  ON public.ride_templates (creator_auth_user_id);

CREATE INDEX IF NOT EXISTS idx_route_info_templates_creator_auth_user_id
  ON public.route_info_templates (creator_auth_user_id);

CREATE INDEX IF NOT EXISTS idx_spot_templates_creator_auth_user_id
  ON public.spot_templates (creator_auth_user_id);

CREATE INDEX IF NOT EXISTS idx_notes_templates_creator_auth_user_id
  ON public.notes_templates (creator_auth_user_id);

CREATE INDEX IF NOT EXISTS idx_saved_routes_creator_auth_user_id
  ON public.saved_routes (creator_auth_user_id);

CREATE INDEX IF NOT EXISTS idx_user_verifications_auth_user_id
  ON public.user_verifications (auth_user_id);

-- ---------------------------------------------------------------------------
-- Phase 5: Backfill parallel ownership columns from mapped users
-- ---------------------------------------------------------------------------

UPDATE public.cycling_events e
SET creator_auth_user_id = u.auth_user_id
FROM public.users u
WHERE e.creator_auth_user_id IS NULL
  AND e.creator_id = u.legacy_user_id
  AND u.auth_user_id IS NOT NULL;

UPDATE public.ride_templates t
SET creator_auth_user_id = u.auth_user_id
FROM public.users u
WHERE t.creator_auth_user_id IS NULL
  AND t.creator_id = u.legacy_user_id
  AND u.auth_user_id IS NOT NULL;

UPDATE public.route_info_templates t
SET creator_auth_user_id = u.auth_user_id
FROM public.users u
WHERE t.creator_auth_user_id IS NULL
  AND t.creator_id = u.legacy_user_id
  AND u.auth_user_id IS NOT NULL;

UPDATE public.spot_templates t
SET creator_auth_user_id = u.auth_user_id
FROM public.users u
WHERE t.creator_auth_user_id IS NULL
  AND t.creator_id = u.legacy_user_id
  AND u.auth_user_id IS NOT NULL;

UPDATE public.notes_templates t
SET creator_auth_user_id = u.auth_user_id
FROM public.users u
WHERE t.creator_auth_user_id IS NULL
  AND t.creator_id = u.legacy_user_id
  AND u.auth_user_id IS NOT NULL;

UPDATE public.saved_routes r
SET creator_auth_user_id = u.auth_user_id
FROM public.users u
WHERE r.creator_auth_user_id IS NULL
  AND r.creator_id = u.legacy_user_id
  AND u.auth_user_id IS NOT NULL;

UPDATE public.user_verifications v
SET auth_user_id = u.auth_user_id
FROM public.users u
WHERE v.auth_user_id IS NULL
  AND v.user_id = u.legacy_user_id
  AND u.auth_user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Phase 6: Foreign keys for the new auth-owned columns
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_auth_user_id_fkey_auth_users'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_auth_user_id_fkey_auth_users
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cycling_events_creator_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.cycling_events
      ADD CONSTRAINT cycling_events_creator_auth_user_id_fkey
      FOREIGN KEY (creator_auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ride_templates_creator_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.ride_templates
      ADD CONSTRAINT ride_templates_creator_auth_user_id_fkey
      FOREIGN KEY (creator_auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'route_info_templates_creator_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.route_info_templates
      ADD CONSTRAINT route_info_templates_creator_auth_user_id_fkey
      FOREIGN KEY (creator_auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'spot_templates_creator_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.spot_templates
      ADD CONSTRAINT spot_templates_creator_auth_user_id_fkey
      FOREIGN KEY (creator_auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notes_templates_creator_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.notes_templates
      ADD CONSTRAINT notes_templates_creator_auth_user_id_fkey
      FOREIGN KEY (creator_auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_routes_creator_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.saved_routes
      ADD CONSTRAINT saved_routes_creator_auth_user_id_fkey
      FOREIGN KEY (creator_auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_verifications_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_verifications
      ADD CONSTRAINT user_verifications_auth_user_id_fkey
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;

-- ---------------------------------------------------------------------------
-- Rollout notes
-- ---------------------------------------------------------------------------
-- 1. Run this migration first.
-- 2. Enable Google auth provider in Supabase.
-- 3. Refactor frontend login to use supabase.auth.signInWithOAuth({ provider:'google' }).
-- 4. On successful login:
--    - read auth user id from supabase.auth.getUser()
--    - upsert public.users using auth_user_id
--    - dual-write creator_auth_user_id / auth_user_id on new records
-- 5. After production data is fully backfilled, switch reads/writes from legacy
--    text IDs to UUID auth columns.
-- 6. Only then tighten RLS to auth.uid()-based policies.
