# Google Auth Phase 1 Handover

日期：2026-04-08

## 狀態摘要

Google 第 1 階段已完成。

目前 production 狀態：

- Google 登入已切到 Supabase Auth
- `public.users` 已引入 `auth_user_id`
- 活動 / 路線 / templates / verification 已改為使用 UUID ownership 欄位
- RLS 已啟用，且核心表 policy 已清理乾淨
- 前端 `lint` / `build` 皆通過

## 已完成項目

### 前端

- Google OAuth 改走 Supabase
  - [src/utils/google.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/utils/google.ts)
  - [src/pages/OAuthCallbackPage.tsx](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/pages/OAuthCallbackPage.tsx)
  - [src/App.tsx](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/App.tsx)

- Google callback 後會把 `auth.users.id` 綁回 `public.users`
  - [src/utils/userService.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/utils/userService.ts)

- 新資料開始雙寫 UUID ownership 欄位
  - [src/stores/eventStore.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/stores/eventStore.ts)
  - [src/stores/routeStore.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/stores/routeStore.ts)
  - [src/stores/templateStore.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/stores/templateStore.ts)
  - [src/stores/notesTemplateStore.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/stores/notesTemplateStore.ts)
  - [src/stores/routeInfoTemplateStore.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/stores/routeInfoTemplateStore.ts)
  - [src/stores/spotTemplateStore.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/stores/spotTemplateStore.ts)

- verification 流程已支援 `auth_user_id`
  - [src/utils/verificationService.ts](/Volumes/OWC%202T/ClaudeCode/約騎系統/src/utils/verificationService.ts)

### DB / Supabase

- schema migration 已完成
  - [supabase_auth_migration_plan.sql](/Volumes/OWC%202T/ClaudeCode/約騎系統/supabase_auth_migration_plan.sql)

- Google-first RLS rollout 已完成
  - [supabase_google_auth_rollout.sql](/Volumes/OWC%202T/ClaudeCode/約騎系統/supabase_google_auth_rollout.sql)

- rollout 說明文件
  - [supabase_google_auth_rollout.md](/Volumes/OWC%202T/ClaudeCode/約騎系統/supabase_google_auth_rollout.md)

## 已確認結果

### RLS

以下表的 `rowsecurity = true`：

- `users`
- `cycling_events`
- `ride_templates`
- `route_info_templates`
- `spot_templates`
- `notes_templates`
- `saved_routes`
- `user_verifications`

### Policy 狀態

目前 policy 已清理為單一有效版本：

- `users`
  - `users_select_public`
  - `users_insert_self`
  - `users_update_self`

- `cycling_events`
  - `cycling_events_select_public`
  - `cycling_events_insert_self`
  - `cycling_events_update_self`
  - `cycling_events_delete_self`

- `ride_templates`
  - `ride_templates_select_public`
  - `ride_templates_insert_self`
  - `ride_templates_update_self`
  - `ride_templates_delete_self`

- `route_info_templates`
  - `route_info_templates_select_public`
  - `route_info_templates_insert_self`
  - `route_info_templates_update_self`
  - `route_info_templates_delete_self`

- `spot_templates`
  - `spot_templates_select_public`
  - `spot_templates_insert_self`
  - `spot_templates_update_self`
  - `spot_templates_delete_self`

- `notes_templates`
  - `notes_templates_select_public`
  - `notes_templates_insert_self`
  - `notes_templates_update_self`
  - `notes_templates_delete_self`

- `saved_routes`
  - `saved_routes_select_public`
  - `saved_routes_insert_self`
  - `saved_routes_update_self`
  - `saved_routes_delete_self`

- `user_verifications`
  - `user_verifications_select_owner`
  - `user_verifications_insert_owner`
  - `user_verifications_update_owner`
  - `user_verifications_delete_owner`

### Data 狀態

確認結果：

- `google_events_missing_creator_auth_user_id = 0`
- `google_routes_missing_creator_auth_user_id = 0`
- `google_users_missing_auth_user_id = 5`

## 殘留項目

目前還有 5 筆 Google 舊帳號尚未補上 `auth_user_id`。

這 5 筆是合理殘留，不是 migration 錯誤。原因是：

- 這些帳號尚未重新透過 Supabase Google OAuth 登入
- 因此 `public.users.auth_user_id` 尚未被 callback 綁定流程補上

已知不影響：

- 既有 Google 活動 ownership
- 既有 Google 路線 ownership
- Google 第 1 階段 RLS 生效

可能影響：

- 這 5 個舊 Google 使用者在重新登入前，`public.users` profile 更新可能受限

## 監控查詢

建議持續觀察：

```sql
select count(*) as google_users_missing_auth_user_id
from public.users
where google_sub is not null
  and auth_user_id is null;
```

若數字逐步下降，代表 rollout 正常。

## 驗證狀態

本地程式驗證：

- `npm run lint` 通過
- `npm run build` 通過

## 下一步

下一階段是 LINE。

建議下一位接手者先做：

1. 判斷 LINE 要走哪種接法
   - Supabase 原生 provider
   - OIDC
   - 保留現有 LINE login，只做 identity binding

2. 定義 `line_user_id` 與 `auth_user_id` 的遷移方式

3. 延用 Google 這套 rollout 模式：
   - 先 migration
   - 再雙寫
   - 再觀察
   - 最後上 RLS

## 一句話交接

Google 已完成從 legacy provider ID 遷到 Supabase Auth UUID ownership，RLS 已啟用並清理乾淨，現在可進 LINE 第 2 階段。
