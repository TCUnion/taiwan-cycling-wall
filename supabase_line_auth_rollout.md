# LINE Supabase Auth Rollout

這份文件只處理 LINE 第 2 階段：確認 LINE 已接到 Supabase Auth，並觀察 legacy LINE 帳號逐步補上 `auth_user_id`。

相關檔案：

- [supabase_auth_migration_plan.sql](/Volumes/OWC%202T/ClaudeCode/約騎系統/supabase_auth_migration_plan.sql)
- [supabase_google_auth_rollout.sql](/Volumes/OWC%202T/ClaudeCode/約騎系統/supabase_google_auth_rollout.sql)
- [supabase_line_auth_rollout.sql](/Volumes/OWC%202T/ClaudeCode/約騎系統/supabase_line_auth_rollout.sql)

## 目標

- LINE 登入改由 `auth.users.id` 作為真正身份
- `public.users` 保留原本文字 ID，但逐步補上 `auth_user_id`
- 新的 LINE 使用者登入後，自動建立 / 更新 `public.users`
- 沿用 Google 已上線的 UUID ownership / RLS 規則，不重複改 policy

## 目前狀態

2026-04-09 已完成人工實測：

- Supabase `custom:line` provider 可正常建立 `auth.users`
- 本地 LINE OAuth 可回到 `http://localhost:5173/oauth/callback?provider=line`
- `public.users` 已可成功寫入：
  - `id = line-U166e0f3a2f4ed0a5d8def1e8f4481b32`
  - `auth_user_id = e355d776-aba1-4bf7-9e36-e9392b8abc06`
  - `line_user_id = U166e0f3a2f4ed0a5d8def1e8f4481b32`
  - `auth_provider = 'line'`

目前監控結果：

```sql
select count(*) as line_users_missing_auth_user_id
from public.users
where line_user_id is not null
  and auth_user_id is null;
```

結果為 `1`，代表還有 1 筆舊 LINE 帳號尚未重新登入補綁。

## 前置條件

前端目前已經具備 LINE OAuth 接線與 callback 綁定：

- [src/utils/line.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/utils/line.ts)
- [src/pages/OAuthCallbackPage.tsx](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/pages/OAuthCallbackPage.tsx)
- [src/App.tsx](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/App.tsx)
- [src/utils/userService.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/utils/userService.ts)

你還需要在 Supabase Dashboard 檢查：

1. `Authentication -> Providers -> Custom OAuth` 的 `custom:line` 已啟用
2. `Authentication -> URL Configuration` 的 `Redirect URLs` 包含：
   - `https://siokiu.criterium.tw/oauth/callback`
   - `http://localhost:5173/oauth/callback`
   - `http://127.0.0.1:5173/oauth/callback`
3. 若 localhost callback 偶爾被退回 Site URL，建議額外加入：
   - `http://localhost:5173/**`
   - `http://127.0.0.1:5173/**`

## 執行順序

### 1. 確認 schema migration 已完成

先確認這份 migration 已經跑過：

- [supabase_auth_migration_plan.sql](/Volumes/OWC%202T/ClaudeCode/約騎系統/supabase_auth_migration_plan.sql)

目的：

- `public.users` 已有 `auth_user_id` / `line_user_id`
- 相關 ownership 欄位與 foreign key 已存在

### 2. 確認 Google-first RLS 已上線

先確認這份 rollout 已執行：

- [supabase_google_auth_rollout.sql](/Volumes/OWC%202T/ClaudeCode/約騎系統/supabase_google_auth_rollout.sql)

原因：

- LINE 不需要再新增另一套 policy
- 目前 `users` / `content tables` 的 RLS 已經是 provider-agnostic
- 只要 LINE 使用者補上 `auth_user_id`，就會自然納入既有 UUID ownership 模式

### 3. 進行 LINE 實測

流程：

1. 打開 login page
2. 點 `LINE 登入`
3. 完成 LINE OAuth
4. 確認回到 `/oauth/callback?provider=line`
5. 確認最後進 `/wall`

### 4. 驗證 `public.users` 是否有綁定成功

建議執行：

```sql
select id, auth_user_id, line_user_id, auth_provider, name, updated_at
from public.users
where line_user_id is not null
order by updated_at desc
limit 20;
```

你要看到：

- `auth_user_id` 不再是 `null`
- `line_user_id` 正確
- `auth_provider = 'line'`

若要查特定 LINE 使用者，可直接用：

```sql
select id, auth_user_id, line_user_id, auth_provider, name, updated_at
from public.users
where line_user_id = 'U166e0f3a2f4ed0a5d8def1e8f4481b32';
```

### 5. 監控尚未補綁的 legacy LINE 帳號

```sql
select count(*) as line_users_missing_auth_user_id
from public.users
where line_user_id is not null
  and auth_user_id is null;
```

判讀：

- `0` 代表所有 LINE 帳號都已重登補綁
- `> 0` 代表仍有舊 LINE 使用者尚未重新登入，不一定是錯誤

## 成功標準

以下條件成立即可視為 LINE rollout 進入穩定觀察期：

- 至少 1 筆新 LINE 登入已成功建立 `auth.users` 與 `public.users` 綁定
- 本地與正式站 callback 都能正常回到前端
- `line_users_missing_auth_user_id` 只剩 legacy 殘留，不再新增新的未綁定資料

## 暫時不要做的事

- 不要重跑或覆蓋既有 Google RLS policy
- 不要直接把 remaining LINE legacy row 手動指定到錯的 `auth_user_id`
- 不要在還沒觀察完 legacy 補綁情況前，就修改 `public.users.id`

## 後續決策點

若 `line_users_missing_auth_user_id` 長期卡住不降，可再評估：

1. 保持自然補綁
2. 針對已知 owner 做人工 backfill
3. 補一支只限 admin / service role 使用的 backfill 腳本

目前建議先採第 1 種，持續觀察。
