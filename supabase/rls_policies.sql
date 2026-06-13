-- Baseline RLS setup for current app behavior.
-- This keeps the app working first, then you can tighten policies later.

BEGIN;

-- Required table privileges for frontend access.
GRANT ALL ON TABLE public.cycling_events TO anon, authenticated;
GRANT ALL ON TABLE public.notes_templates TO anon, authenticated;
GRANT ALL ON TABLE public.ride_templates TO anon, authenticated;
GRANT ALL ON TABLE public.route_info_templates TO anon, authenticated;
GRANT ALL ON TABLE public.saved_routes TO anon, authenticated;
GRANT ALL ON TABLE public.spot_templates TO anon, authenticated;
GRANT ALL ON TABLE public.tcuad_internal_placements TO anon, authenticated;
GRANT ALL ON TABLE public.tcuad_placements TO anon, authenticated;
GRANT ALL ON TABLE public.user_roles TO anon, authenticated;
GRANT ALL ON TABLE public.user_verifications TO anon, authenticated;
GRANT ALL ON TABLE public.users TO anon, authenticated;

-- Enable RLS on every public table used by the app.
ALTER TABLE public.cycling_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_info_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tcuad_internal_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tcuad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Reset policies so the script can be re-run safely.
DROP POLICY IF EXISTS "cycling_events_select_all" ON public.cycling_events;
DROP POLICY IF EXISTS "cycling_events_insert_all" ON public.cycling_events;
DROP POLICY IF EXISTS "cycling_events_update_all" ON public.cycling_events;
DROP POLICY IF EXISTS "cycling_events_delete_all" ON public.cycling_events;

DROP POLICY IF EXISTS "notes_templates_select_all" ON public.notes_templates;
DROP POLICY IF EXISTS "notes_templates_insert_all" ON public.notes_templates;
DROP POLICY IF EXISTS "notes_templates_update_all" ON public.notes_templates;
DROP POLICY IF EXISTS "notes_templates_delete_all" ON public.notes_templates;

DROP POLICY IF EXISTS "ride_templates_select_all" ON public.ride_templates;
DROP POLICY IF EXISTS "ride_templates_insert_all" ON public.ride_templates;
DROP POLICY IF EXISTS "ride_templates_update_all" ON public.ride_templates;
DROP POLICY IF EXISTS "ride_templates_delete_all" ON public.ride_templates;

DROP POLICY IF EXISTS "route_info_templates_select_all" ON public.route_info_templates;
DROP POLICY IF EXISTS "route_info_templates_insert_all" ON public.route_info_templates;
DROP POLICY IF EXISTS "route_info_templates_update_all" ON public.route_info_templates;
DROP POLICY IF EXISTS "route_info_templates_delete_all" ON public.route_info_templates;

DROP POLICY IF EXISTS "saved_routes_select_all" ON public.saved_routes;
DROP POLICY IF EXISTS "saved_routes_insert_all" ON public.saved_routes;
DROP POLICY IF EXISTS "saved_routes_update_all" ON public.saved_routes;
DROP POLICY IF EXISTS "saved_routes_delete_all" ON public.saved_routes;

DROP POLICY IF EXISTS "spot_templates_select_all" ON public.spot_templates;
DROP POLICY IF EXISTS "spot_templates_insert_all" ON public.spot_templates;
DROP POLICY IF EXISTS "spot_templates_update_all" ON public.spot_templates;
DROP POLICY IF EXISTS "spot_templates_delete_all" ON public.spot_templates;

DROP POLICY IF EXISTS "tcuad_internal_placements_select_all" ON public.tcuad_internal_placements;
DROP POLICY IF EXISTS "tcuad_internal_placements_insert_all" ON public.tcuad_internal_placements;
DROP POLICY IF EXISTS "tcuad_internal_placements_update_all" ON public.tcuad_internal_placements;
DROP POLICY IF EXISTS "tcuad_internal_placements_delete_all" ON public.tcuad_internal_placements;

DROP POLICY IF EXISTS "tcuad_placements_select_all" ON public.tcuad_placements;
DROP POLICY IF EXISTS "tcuad_placements_insert_all" ON public.tcuad_placements;
DROP POLICY IF EXISTS "tcuad_placements_update_all" ON public.tcuad_placements;
DROP POLICY IF EXISTS "tcuad_placements_delete_all" ON public.tcuad_placements;

DROP POLICY IF EXISTS "user_roles_select_all" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_all" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_all" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_all" ON public.user_roles;

DROP POLICY IF EXISTS "user_verifications_select_all" ON public.user_verifications;
DROP POLICY IF EXISTS "user_verifications_insert_all" ON public.user_verifications;
DROP POLICY IF EXISTS "user_verifications_update_all" ON public.user_verifications;
DROP POLICY IF EXISTS "user_verifications_delete_all" ON public.user_verifications;

DROP POLICY IF EXISTS "users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_insert_all" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_delete_all" ON public.users;

-- Permissive baseline policies.
CREATE POLICY "cycling_events_select_all" ON public.cycling_events FOR SELECT USING (true);
CREATE POLICY "cycling_events_insert_all" ON public.cycling_events FOR INSERT WITH CHECK (true);
CREATE POLICY "cycling_events_update_all" ON public.cycling_events FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "cycling_events_delete_all" ON public.cycling_events FOR DELETE USING (true);

CREATE POLICY "notes_templates_select_all" ON public.notes_templates FOR SELECT USING (true);
CREATE POLICY "notes_templates_insert_all" ON public.notes_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "notes_templates_update_all" ON public.notes_templates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "notes_templates_delete_all" ON public.notes_templates FOR DELETE USING (true);

CREATE POLICY "ride_templates_select_all" ON public.ride_templates FOR SELECT USING (true);
CREATE POLICY "ride_templates_insert_all" ON public.ride_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "ride_templates_update_all" ON public.ride_templates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "ride_templates_delete_all" ON public.ride_templates FOR DELETE USING (true);

CREATE POLICY "route_info_templates_select_all" ON public.route_info_templates FOR SELECT USING (true);
CREATE POLICY "route_info_templates_insert_all" ON public.route_info_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "route_info_templates_update_all" ON public.route_info_templates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "route_info_templates_delete_all" ON public.route_info_templates FOR DELETE USING (true);

CREATE POLICY "saved_routes_select_all" ON public.saved_routes FOR SELECT USING (true);
CREATE POLICY "saved_routes_insert_all" ON public.saved_routes FOR INSERT WITH CHECK (true);
CREATE POLICY "saved_routes_update_all" ON public.saved_routes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "saved_routes_delete_all" ON public.saved_routes FOR DELETE USING (true);

CREATE POLICY "spot_templates_select_all" ON public.spot_templates FOR SELECT USING (true);
CREATE POLICY "spot_templates_insert_all" ON public.spot_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "spot_templates_update_all" ON public.spot_templates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "spot_templates_delete_all" ON public.spot_templates FOR DELETE USING (true);

CREATE POLICY "tcuad_internal_placements_select_all" ON public.tcuad_internal_placements FOR SELECT USING (true);
CREATE POLICY "tcuad_internal_placements_insert_all" ON public.tcuad_internal_placements FOR INSERT WITH CHECK (true);
CREATE POLICY "tcuad_internal_placements_update_all" ON public.tcuad_internal_placements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "tcuad_internal_placements_delete_all" ON public.tcuad_internal_placements FOR DELETE USING (true);

CREATE POLICY "tcuad_placements_select_all" ON public.tcuad_placements FOR SELECT USING (true);
CREATE POLICY "tcuad_placements_insert_all" ON public.tcuad_placements FOR INSERT WITH CHECK (true);
CREATE POLICY "tcuad_placements_update_all" ON public.tcuad_placements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "tcuad_placements_delete_all" ON public.tcuad_placements FOR DELETE USING (true);

CREATE POLICY "user_roles_select_all" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "user_roles_insert_all" ON public.user_roles FOR INSERT WITH CHECK (true);
CREATE POLICY "user_roles_update_all" ON public.user_roles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "user_roles_delete_all" ON public.user_roles FOR DELETE USING (true);

CREATE POLICY "user_verifications_select_all" ON public.user_verifications FOR SELECT USING (true);
CREATE POLICY "user_verifications_insert_all" ON public.user_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "user_verifications_update_all" ON public.user_verifications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "user_verifications_delete_all" ON public.user_verifications FOR DELETE USING (true);

CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_all" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);
CREATE POLICY "users_delete_all" ON public.users FOR DELETE USING (true);

COMMIT;
