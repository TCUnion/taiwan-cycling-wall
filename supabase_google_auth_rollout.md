# Google-First Supabase Auth Rollout

這份文件只處理第 1 階段：先把 Google 完成。

相關檔案：

- [supabase_auth_migration_plan.sql](/Volumes/OWC%202T/ClaudeCode/約騎系統/supabase_auth_migration_plan.sql)
- [supabase_google_auth_rollout.sql](/Volumes/OWC%202T/ClaudeCode/約騎系統/supabase_google_auth_rollout.sql)

## 目標

- Google 登入改由 `auth.users.id` 作為真正身份
- `public.users` 保留原本文字 ID，但新增 `auth_user_id`
- 所有新寫入資料同時寫入 `creator_auth_user_id`
- RLS 先改成用 UUID ownership 控制寫入

## 前置條件

前端目前已經具備 Google OAuth 基本接線：

- [src/utils/google.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/utils/google.ts)
- [src/pages/OAuthCallbackPage.tsx](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/pages/OAuthCallbackPage.tsx)
- [src/utils/userService.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/utils/userService.ts)

你還需要在 Supabase Dashboard 檢查：

1. `Authentication -> Providers -> Google` 已啟用
2. Site URL 正確
3. Redirect URL 包含：
   - `https://siokiu.criterium.tw/oauth/callback`
   - 如果你還保留相容路徑，也可加 `https://siokiu.criterium.tw/auth/callback`

## 執行順序

### 1. 先在 staging 跑 schema migration

執行：

- [supabase_auth_migration_plan.sql](/Volumes/OWC%202T/ClaudeCode/約騎系統/supabase_auth_migration_plan.sql)

目的：

- 補欄位
- 補 index
- 補 foreign key
- 先回填既有 `google-*` 資料到 `google_sub`

### 2. 檢查 migration 是否成功

建議執行：

```sql
select count(*) from public.users where legacy_user_id is null;

select count(*) from public.users
where id like 'google-%'
  and google_sub is null;

select count(*) from public.cycling_events
where creator_id is not null
  and creator_auth_user_id is null;
```

判讀：

- 前兩個應接近 0
- 第三個可以不為 0，因為舊 Google 使用者還沒真正登入綁定 `auth_user_id`

### 3. 用 staging 實測一次 Google 登入

流程：

1. 用一個 Google 帳號登入
2. 完成 OAuth callback
3. 確認 `public.users` 對應列已被更新：

```sql
select id, auth_user_id, google_sub, auth_provider, email
from public.users
where google_sub is not null
order by updated_at desc
limit 20;
```

你要看到：

- `auth_user_id` 不再是 `null`
- `google_sub` 正確
- `auth_provider = 'google'`

### 4. 跑 Google-first RLS

執行：

- [supabase_google_auth_rollout.sql](/Volumes/OWC%202T/ClaudeCode/約騎系統/supabase_google_auth_rollout.sql)

這份 SQL 做的事：

- 對 `users`、`cycling_events`、templates、`saved_routes`、`user_verifications` 開啟 RLS
- 保持公開讀取
- 把所有寫入權限改成 `auth.uid() = auth_user_id / creator_auth_user_id`

### 5. 再做一次功能驗證

至少驗這些：

1. Google 登入成功
2. 建立活動成功
3. 編輯自己活動成功
4. 刪除自己路線成功
5. LINE 驗證 token 建立成功

## 成功標準

以下查詢結果應合理：

```sql
select count(*)
from public.users
where google_sub is not null
  and auth_user_id is null;

select count(*)
from public.cycling_events
where creator_id like 'google-%'
  and creator_auth_user_id is null;

select count(*)
from public.saved_routes
where creator_id like 'google-%'
  and creator_auth_user_id is null;
```

如果你已經讓 Google 活躍使用者重新登入過，這些數字應逐步下降。

## 暫時不要做的事

- 不要把 `public.users.id` 直接改成 UUID
- 不要刪除 `creator_id` / `user_id`
- 不要在 Facebook / LINE / Strava 還沒接到 Supabase Auth 前，就把所有 provider 一起切掉

## Google 完成後的下一步

第 2 階段再做 LINE：

- 啟用 LINE 對應的 Supabase Auth provider 或自建 OIDC
- callback 後寫入 `auth_user_id`
- 補 `line_user_id`
- 複用同一套 ownership / RLS 模式
