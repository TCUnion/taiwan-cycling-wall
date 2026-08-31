-- 線上 RLS 現況快照（2026-08-31 由 pg_policies 產出）
-- 專案：jxubndwcralkrbunxokf（siokiu）
--
-- 這份檔案是「線上實際生效的嚴格版 policy」。舊版寬鬆 baseline（全部 USING (true)）
-- 已於 2026-08-31 移除，歷史版本在 git 裡（commit 之前的 supabase/rls_policies.sql）。
-- 舊版之所以危險：它的 DROP 名稱是 *_all 系列，跟線上的 *_self 系列不同名，
-- 直接執行不會覆蓋線上 policy，而是「額外新增」一組寬鬆 policy。
-- PostgreSQL 的 PERMISSIVE policy 之間是 OR，等於當場把整個資料庫的寫入權限打開。
--
-- 寫入權的判準一律是 auth.uid()，需要真正的 Supabase Auth session（目前只有 Google / LINE OAuth 會建）。
-- anon 角色雖然有 GRANT ALL，但沒有任何 INSERT/UPDATE/DELETE policy，所以寫不進去。

BEGIN;

-- 前端存取所需的 table 權限（實際閘門是 RLS，不是這裡）
GRANT ALL ON TABLE public.cycling_events TO anon, authenticated;
GRANT ALL ON TABLE public.event_sponsors TO anon, authenticated;
GRANT ALL ON TABLE public.notes_templates TO anon, authenticated;
GRANT ALL ON TABLE public.ride_templates TO anon, authenticated;
GRANT ALL ON TABLE public.route_info_templates TO anon, authenticated;
GRANT ALL ON TABLE public.saved_routes TO anon, authenticated;
GRANT ALL ON TABLE public.sponsor_events TO anon, authenticated;
GRANT ALL ON TABLE public.sponsors TO anon, authenticated;
GRANT ALL ON TABLE public.spot_templates TO anon, authenticated;
GRANT ALL ON TABLE public.tcuad_internal_placements TO anon, authenticated;
GRANT ALL ON TABLE public.tcuad_placements TO anon, authenticated;
GRANT ALL ON TABLE public.user_roles TO anon, authenticated;
GRANT ALL ON TABLE public.user_verifications TO anon, authenticated;
GRANT ALL ON TABLE public.users TO anon, authenticated;
GRANT ALL ON TABLE public.weather_points TO anon, authenticated;

ALTER TABLE public.cycling_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_info_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tcuad_internal_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tcuad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_points ENABLE ROW LEVEL SECURITY;

-- 清掉 2026-06 以前的寬鬆 baseline（若某個環境還留著，這裡會一併移除）
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
DROP POLICY IF EXISTS "tcuad_internal_placements_insert_all" ON public.tcuad_internal_placements;
DROP POLICY IF EXISTS "tcuad_internal_placements_update_all" ON public.tcuad_internal_placements;
DROP POLICY IF EXISTS "tcuad_internal_placements_delete_all" ON public.tcuad_internal_placements;
DROP POLICY IF EXISTS "tcuad_placements_insert_all" ON public.tcuad_placements;
DROP POLICY IF EXISTS "tcuad_placements_update_all" ON public.tcuad_placements;
DROP POLICY IF EXISTS "tcuad_placements_delete_all" ON public.tcuad_placements;
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
DROP POLICY IF EXISTS "users_bind_orphan" ON public.users;

-- 讓本檔可重複執行
DROP POLICY IF EXISTS cycling_events_select_public ON public.cycling_events;
DROP POLICY IF EXISTS cycling_events_insert_self ON public.cycling_events;
DROP POLICY IF EXISTS cycling_events_update_self ON public.cycling_events;
DROP POLICY IF EXISTS cycling_events_delete_self ON public.cycling_events;
DROP POLICY IF EXISTS event_sponsors_anon_read_active ON public.event_sponsors;
DROP POLICY IF EXISTS event_sponsors_auth_all ON public.event_sponsors;
DROP POLICY IF EXISTS notes_templates_select_public ON public.notes_templates;
DROP POLICY IF EXISTS notes_templates_insert_self ON public.notes_templates;
DROP POLICY IF EXISTS notes_templates_update_self ON public.notes_templates;
DROP POLICY IF EXISTS notes_templates_delete_self ON public.notes_templates;
DROP POLICY IF EXISTS ride_templates_select_public ON public.ride_templates;
DROP POLICY IF EXISTS ride_templates_insert_self ON public.ride_templates;
DROP POLICY IF EXISTS ride_templates_update_self ON public.ride_templates;
DROP POLICY IF EXISTS ride_templates_delete_self ON public.ride_templates;
DROP POLICY IF EXISTS route_info_templates_select_public ON public.route_info_templates;
DROP POLICY IF EXISTS route_info_templates_insert_self ON public.route_info_templates;
DROP POLICY IF EXISTS route_info_templates_update_self ON public.route_info_templates;
DROP POLICY IF EXISTS route_info_templates_delete_self ON public.route_info_templates;
DROP POLICY IF EXISTS saved_routes_select_public ON public.saved_routes;
DROP POLICY IF EXISTS saved_routes_insert_self ON public.saved_routes;
DROP POLICY IF EXISTS saved_routes_update_self ON public.saved_routes;
DROP POLICY IF EXISTS saved_routes_delete_self ON public.saved_routes;
DROP POLICY IF EXISTS sponsor_events_anon_read_active ON public.sponsor_events;
DROP POLICY IF EXISTS sponsor_events_auth_all ON public.sponsor_events;
DROP POLICY IF EXISTS sponsors_anon_read_active ON public.sponsors;
DROP POLICY IF EXISTS sponsors_auth_all ON public.sponsors;
DROP POLICY IF EXISTS spot_templates_select_public ON public.spot_templates;
DROP POLICY IF EXISTS spot_templates_insert_self ON public.spot_templates;
DROP POLICY IF EXISTS spot_templates_update_self ON public.spot_templates;
DROP POLICY IF EXISTS spot_templates_delete_self ON public.spot_templates;
DROP POLICY IF EXISTS tcuad_internal_placements_select_all ON public.tcuad_internal_placements;
DROP POLICY IF EXISTS tcuad_placements_select_all ON public.tcuad_placements;
DROP POLICY IF EXISTS user_roles_select_all ON public.user_roles;
DROP POLICY IF EXISTS user_verifications_select_owner ON public.user_verifications;
DROP POLICY IF EXISTS user_verifications_insert_owner ON public.user_verifications;
DROP POLICY IF EXISTS user_verifications_update_owner ON public.user_verifications;
DROP POLICY IF EXISTS user_verifications_delete_owner ON public.user_verifications;
DROP POLICY IF EXISTS users_select_public ON public.users;
DROP POLICY IF EXISTS users_insert_self ON public.users;
DROP POLICY IF EXISTS users_update_self_or_bind_orphan ON public.users;
DROP POLICY IF EXISTS weather_points_read ON public.weather_points;
DROP POLICY IF EXISTS weather_points_service_write ON public.weather_points;

-- cycling_events：公開可讀，只有發起人本人可寫
CREATE POLICY cycling_events_select_public ON public.cycling_events FOR SELECT TO public USING (true);
CREATE POLICY cycling_events_insert_self ON public.cycling_events FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = creator_auth_user_id));
CREATE POLICY cycling_events_update_self ON public.cycling_events FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = creator_auth_user_id)) WITH CHECK (((SELECT auth.uid()) = creator_auth_user_id));
CREATE POLICY cycling_events_delete_self ON public.cycling_events FOR DELETE TO authenticated USING (((SELECT auth.uid()) = creator_auth_user_id));

-- 四張範本表 + 收藏路線：同一套 owner 模型
CREATE POLICY notes_templates_select_public ON public.notes_templates FOR SELECT TO public USING (true);
CREATE POLICY notes_templates_insert_self ON public.notes_templates FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = creator_auth_user_id));
CREATE POLICY notes_templates_update_self ON public.notes_templates FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = creator_auth_user_id)) WITH CHECK (((SELECT auth.uid()) = creator_auth_user_id));
CREATE POLICY notes_templates_delete_self ON public.notes_templates FOR DELETE TO authenticated USING (((SELECT auth.uid()) = creator_auth_user_id));

CREATE POLICY ride_templates_select_public ON public.ride_templates FOR SELECT TO public USING (true);
CREATE POLICY ride_templates_insert_self ON public.ride_templates FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = creator_auth_user_id));
CREATE POLICY ride_templates_update_self ON public.ride_templates FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = creator_auth_user_id)) WITH CHECK (((SELECT auth.uid()) = creator_auth_user_id));
CREATE POLICY ride_templates_delete_self ON public.ride_templates FOR DELETE TO authenticated USING (((SELECT auth.uid()) = creator_auth_user_id));

CREATE POLICY route_info_templates_select_public ON public.route_info_templates FOR SELECT TO public USING (true);
CREATE POLICY route_info_templates_insert_self ON public.route_info_templates FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = creator_auth_user_id));
CREATE POLICY route_info_templates_update_self ON public.route_info_templates FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = creator_auth_user_id)) WITH CHECK (((SELECT auth.uid()) = creator_auth_user_id));
CREATE POLICY route_info_templates_delete_self ON public.route_info_templates FOR DELETE TO authenticated USING (((SELECT auth.uid()) = creator_auth_user_id));

CREATE POLICY spot_templates_select_public ON public.spot_templates FOR SELECT TO public USING (true);
CREATE POLICY spot_templates_insert_self ON public.spot_templates FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = creator_auth_user_id));
CREATE POLICY spot_templates_update_self ON public.spot_templates FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = creator_auth_user_id)) WITH CHECK (((SELECT auth.uid()) = creator_auth_user_id));
CREATE POLICY spot_templates_delete_self ON public.spot_templates FOR DELETE TO authenticated USING (((SELECT auth.uid()) = creator_auth_user_id));

CREATE POLICY saved_routes_select_public ON public.saved_routes FOR SELECT TO public USING (true);
CREATE POLICY saved_routes_insert_self ON public.saved_routes FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = creator_auth_user_id));
CREATE POLICY saved_routes_update_self ON public.saved_routes FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = creator_auth_user_id)) WITH CHECK (((SELECT auth.uid()) = creator_auth_user_id));
CREATE POLICY saved_routes_delete_self ON public.saved_routes FOR DELETE TO authenticated USING (((SELECT auth.uid()) = creator_auth_user_id));

-- 廣告版位：唯讀
CREATE POLICY tcuad_internal_placements_select_all ON public.tcuad_internal_placements FOR SELECT TO public USING (true);
CREATE POLICY tcuad_placements_select_all ON public.tcuad_placements FOR SELECT TO public USING (true);

-- 會員等級：唯讀（改動走 Dashboard / service_role）
CREATE POLICY user_roles_select_all ON public.user_roles FOR SELECT TO public USING (true);

-- 贊助商：登入者全權，未登入只讀 is_active
CREATE POLICY sponsors_anon_read_active ON public.sponsors FOR SELECT TO anon USING ((is_active = true));
CREATE POLICY sponsors_auth_all ON public.sponsors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY sponsor_events_anon_read_active ON public.sponsor_events FOR SELECT TO anon USING ((is_active = true));
CREATE POLICY sponsor_events_auth_all ON public.sponsor_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY event_sponsors_anon_read_active ON public.event_sponsors FOR SELECT TO anon USING ((is_active = true));
CREATE POLICY event_sponsors_auth_all ON public.event_sponsors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TCU 認證：只有本人看得到自己的認證碼
CREATE POLICY user_verifications_select_owner ON public.user_verifications FOR SELECT TO authenticated USING (((SELECT auth.uid()) = auth_user_id));
CREATE POLICY user_verifications_insert_owner ON public.user_verifications FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = auth_user_id));
CREATE POLICY user_verifications_update_owner ON public.user_verifications FOR UPDATE TO authenticated USING (((SELECT auth.uid()) = auth_user_id)) WITH CHECK (((SELECT auth.uid()) = auth_user_id));
CREATE POLICY user_verifications_delete_owner ON public.user_verifications FOR DELETE TO authenticated USING (((SELECT auth.uid()) = auth_user_id));

-- users：公開可讀（公布欄要顯示發起人）。
-- UPDATE 的 USING 有兩條路：
--   1. auth.uid() = auth_user_id —— 一般情況，改自己那條
--   2. auth_user_id IS NULL 且 email 與 JWT 的 email 相符 —— 認領孤兒 row
-- 第 2 條解的是 2026-07-06 的雞生蛋死結：舊資料的 auth_user_id 是 NULL，
-- 想寫回 uid 的那個 UPDATE 會被自己的 policy 擋掉，legacy 帳號永遠補不上而全數 403。
-- WITH CHECK 仍要求寫完之後 auth_user_id = auth.uid()，且 email 由 Supabase 驗證過，
-- 所以無法拿別人的 row 來認領。使用者下次登入即自動修復。
-- users 沒有 DELETE policy —— 刪帳號一律走 service_role。
CREATE POLICY users_select_public ON public.users FOR SELECT TO public USING (true);
CREATE POLICY users_insert_self ON public.users FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()) = auth_user_id));
CREATE POLICY users_update_self_or_bind_orphan ON public.users FOR UPDATE TO authenticated
  USING ((((SELECT auth.uid()) = auth_user_id) OR ((auth_user_id IS NULL) AND (lower(email) = lower(((SELECT auth.jwt()) ->> 'email'::text))))))
  WITH CHECK (((SELECT auth.uid()) = auth_user_id));

-- 天氣快取：任何人可讀，只有 n8n（service_role）能寫
CREATE POLICY weather_points_read ON public.weather_points FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY weather_points_service_write ON public.weather_points FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMIT;
