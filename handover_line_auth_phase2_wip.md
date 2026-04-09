# LINE Auth Phase 2 Handover

日期：2026-04-09

## 狀態摘要

LINE 第 2 階段目前做到「Supabase provider 已設定，前端程式已接上，且第一次人工實測已成功」。

今天已完成：

- Supabase `custom:line` provider 設定完成
- LINE Developers Console callback 已加入 Supabase callback
- 前端 LINE 登入已改走 `supabase.auth.signInWithOAuth`
- callback 頁已加入 `provider=line` 分支
- `public.users` 綁定流程已新增 `line_user_id` / `auth_user_id` 回填邏輯
- 本地型別與 auth store 已補 `lineUserId`
- 補強 `custom:line` provider 辨識與 callback 錯誤顯示
- LINE end-to-end 手測成功
- `eslint` scoped 檢查通過
- `npm run build` 通過

今天尚未完成：

- LINE 資料 backfill 觀察
- 視觀察結果決定是否要補 admin / service role backfill 工具

## Supabase / LINE Console 設定

### Supabase Custom Provider

已設定為：

- `Identifier`: `custom:line`
- `Issuer URL`: `https://access.line.me`
- `Authorization URL`: `https://access.line.me/oauth2/v2.1/authorize`
- `Token URL`: `https://api.line.me/oauth2/v2.1/token`
- `Userinfo URL`: `https://api.line.me/oauth2/v2.1/userinfo`
- `JWKS URI`: `https://api.line.me/oauth2/v2.1/certs`
- `Scopes`: `openid profile`
- `Allow users without email`: enabled

### Callback / Redirect

LINE Developers Console 已加入：

- `https://jxubndwcralkrbunxokf.supabase.co/auth/v1/callback`

Supabase `Redirect URLs` 已確認包含：

- `https://siokiu.criterium.tw/oauth/callback`
- `http://localhost:5173/oauth/callback`
- `http://127.0.0.1:5173/oauth/callback`

## 已修改檔案

### LINE OAuth 啟動

- [src/utils/line.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/utils/line.ts)
  - 舊的前端自行交換 token / PKCE 流程已移除
  - 改為：
    - `supabase.auth.signInWithOAuth({ provider: 'custom:line' })`
    - redirect 到 `/oauth/callback?provider=line`

### Login / Callback

- [src/pages/LoginPage.tsx](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/pages/LoginPage.tsx)
  - LINE 按鈕已改為走 Supabase OAuth

- [src/pages/OAuthCallbackPage.tsx](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/pages/OAuthCallbackPage.tsx)
  - 新增 `provider=line` 分支
  - callback 後從 Supabase session / user 取 LINE identity
  - 補強 `custom:line` provider 判斷
  - 若 `public.users` 綁定失敗，直接顯示錯誤，不再假成功登入
  - 成功時會：
    - 呼叫 `綁定LINEAuth使用者(...)`
    - 呼叫 `LINE登入(..., authUserId)`
    - 導回 `/wall`

### App 啟動同步

- [src/App.tsx](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/App.tsx)
  - App 啟動時已支援同步 LINE Supabase session
  - 補強 `custom:line` provider 判斷
  - 若當前 auth user 帶 LINE identity，會自動做本地登入與使用者綁定

### User / Store / Mapping

- [src/utils/userService.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/utils/userService.ts)
  - `toDbRow` / `fromDbRow` 已加入 `line_user_id`
  - major `select(...)` 欄位已補 `line_user_id`
  - 新增 `綁定LINEAuth使用者(...)`
  - `更新使用者欄位(...)` 已支援 `lineUserId`

- [src/stores/authStore.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/stores/authStore.ts)
  - `LINE登入` 已改為可帶 `authUserId`
  - 本地 user 會保留 `lineUserId`

- [src/types/index.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/types/index.ts)
  - `User` 已新增 `lineUserId?: string`

## 本地驗證

已完成：

- LINE OAuth 人工實測成功
- 成功回到 `http://localhost:5173/oauth/callback?provider=line`
- 成功進入 `/wall`
- `public.users` 已成功出現：
  - `id = line-U166e0f3a2f4ed0a5d8def1e8f4481b32`
  - `auth_user_id = e355d776-aba1-4bf7-9e36-e9392b8abc06`
  - `line_user_id = U166e0f3a2f4ed0a5d8def1e8f4481b32`
  - `auth_provider = 'line'`
- 監控查詢結果：
  - `line_users_missing_auth_user_id = 1`
- scoped `eslint` 通過
- `npm run build` 通過

本地 dev server 已啟動過，網址：

- `http://localhost:5173/`

當時 listener PID：

- `19907`

如果明天要續測，可先確認 5173 是否仍在 listen；若沒有，再重新跑：

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

## 下一步

先補 LINE rollout 文件與 SQL，不要再動既有 Google RLS policy。

### 監控查詢

持續觀察：

```sql
select count(*) as line_users_missing_auth_user_id
from public.users
where line_user_id is not null
  and auth_user_id is null;
```

接著寫：

- `supabase_line_auth_rollout.md`
- `supabase_line_auth_rollout.sql`

原則：

- 將 LINE 舊帳號逐步補上 `auth_user_id`
- 沿用 Google 已上線的 UUID ownership
- 先觀察，不重複改 policy

## 一句話交接

LINE 第二階段已完成第一次真實登入驗證，`auth.users -> public.users` 綁定成功，rollout 文件與 SQL 已補齊，目前剩 1 筆舊 LINE 帳號未補 `auth_user_id`，下一步是持續觀察是否自然補綁。
