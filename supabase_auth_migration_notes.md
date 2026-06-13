# Supabase Auth 遷移摘要

## 目標

- 讓登入身份以 `auth.users.id` 為準
- 讓 `public.users` 變成 profile 表，而不是身份來源
- 讓 `users` 與其他資料表最終可使用 `auth.uid()` 做 RLS

## 現況問題

- 前端現在自己組 `users.id`
- 格式包含 `fb-*`、`google-*`、`line-*`、`strava-*`
- 專案沒有使用 Supabase Auth session
- 所以 `auth.uid()` 目前不能拿來限制「只能本人更新」

## 草案內容

對應 SQL 在 [supabase_auth_migration_plan.sql](/Volumes/OWC%202T/ClaudeCode/約騎系統/supabase_auth_migration_plan.sql)

這份草案做的事：

1. 新增 `public.user_identity_links`
   - 用來記錄 `user_id + provider + provider_subject`
   - 避免把 provider 邏輯全部塞進 `users`

2. 擴充 `public.users`
   - 新增 `auth_user_id`
   - 新增 `legacy_user_id`
   - 新增 `google_sub` / `facebook_user_id` / `line_user_id` / `strava_athlete_id`

3. 擴充關聯表
   - 新增 `creator_auth_user_id` 到各種 `creator_id` 表
   - 新增 `auth_user_id` 到 `user_verifications`

4. 保留舊欄位
   - 不會立刻移除 `creator_id` / `user_id`
   - 先讓前後端能雙寫，降低切換風險

## 建議執行順序

1. 先跑 migration SQL
2. 在 Supabase Dashboard 開 Google provider
3. 前端改 Google login 到 `supabase.auth.signInWithOAuth`
4. callback 後用 `auth.users.id` upsert `public.users`
5. 新資料開始雙寫：
   - 舊欄位：`creator_id`
   - 新欄位：`creator_auth_user_id`
6. 等舊資料補齊後，再把查詢和 RLS 切到 UUID 欄位

## 目前不要做的事

- 不要直接把 `public.users.id` 改成 UUID
- 不要先套 `auth.uid() = id` 到 production
- 不要在關聯表還沒搬完前移除舊 `creator_id`

## 最後目標

`public.users` 最後可用這類 policy：

```sql
CREATE POLICY "users_select_public" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "users_insert_self" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);
```

其他內容表則改成：

- 可公開讀取的資料：`SELECT USING (true)`
- 可編輯資料：`creator_auth_user_id = auth.uid()`
