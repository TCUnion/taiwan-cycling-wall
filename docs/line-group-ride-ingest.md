# LINE 群組約騎訊息 → 相揪公布欄（設計草稿）

2026-09-30 與使用者討論定案的部分，給 `/grill-with-docs` → `/to-spec` 當輸入。尚未開票、尚未實作。

## 目標

24EZGO 的 LINE bot 被邀進約騎群組後，自動辨識群組裡的約騎資訊，經管理員審核後公布到相揪公布欄（`siokiu.criterium.tw`）。

## 已定案

- **bot 在群組只讀不發文。** 不回卡片、不回連結、不回群組 ID。前置已做：24ezgo-ops 分支 `feat/line-groups-status`（群組頁看得到 bot 在哪些群與群組 ID，並拿掉 join／`/id` 的群內回覆）。
- **要人工審核才上牆。** AI 抽取的結果先進待審區，管理員在相揪後台按「公布」才寫進 `cycling_events`。
- **只有白名單內的約騎群會被處理**，與 24ezgo-ops 內部群的 AI 回覆白名單（`groupAllowed`）分開。

## 流程草案

1. **入口**：24ezgo-ops 的 `/webhooks/line-oa`，群組訊息照舊寫 `ezgo.group_messages`。約騎群白名單命中且關鍵字預篩（日期、時間、集合、公里、配速…）命中時，`ctx.waitUntil` 丟背景。
2. **抽取**：Claude Haiku 4.5 structured output，欄位對齊 `cycling_events`：`title / date / time / county_id / meeting_point / distance / elevation / pace / strava_route_url / description`。判斷不是約騎就丟棄。
3. **送審**：呼叫相揪 Supabase 的 Edge Function（例如 `ingest-line-ride`），共用密鑰驗證，service role 寫入新表 `pending_ride_events`（原文、抽取結果、LINE userId、群組 id／名稱、`line_message_id` UNIQUE 去重、狀態 pending／published／rejected）。
4. **審核**：相揪 `/admin` 加「LINE 待審」頁，可修正欄位後公布或略過。公布時寫 `cycling_events`，掛在發文者本人名下或「相揪小幫手」系統帳號名下。
5. **通知審核者**（選配）：只私訊管理員，不發到群組。

## 待決（grill 時要問）

- **LINE userId 對不對得上**：userId 是「每個 provider 各一組」。24EZGO OA 與相揪的 LINE Login／LIFF 若不在同一個 provider，同一個人的 userId 不同，就無法用 `line-{userId}` 或 `users.line_verified_user_id` 對到相揪帳號，只能一律掛系統帳號，或在待審頁手動指定。要先查兩邊的 provider。
- **系統帳號**：`cycling_events` 的 RLS 要求 `auth.uid() = creator_auth_user_id`，公布走 service role 時要決定 `creator_id` 與 `creator_auth_user_id` 填誰，以及系統帳號的活動是否計入 `max_active_events`。
- **同意與告知**：群組成員不知道貼文會被公開。群公告要不要寫一句、是否只收群主／特定成員的貼文。
- **去重規則**：同一團在群裡被轉貼或更新時間，怎麼判斷是同一團（日期＋時間＋集合點？）與更新既有待審項。
- **白名單放哪**：wrangler 環境變數，或存在 `ezgo.line_groups` 加一欄用途，從 ops 群組頁勾選。
- **Strava**：只轉存路線網址；不得把 Strava API 資料送進 AI（Strava API Policy 5.3）。
- **額度與成本**：只讀不發文不耗 LINE 訊息額度；Haiku 呼叫量取決於預篩命中率。

## 跨專案邊界

24EZGO（`ezgo` schema）與相揪（`public` schema）其實在**同一個 Supabase 專案** `jxubndwcralkrbunxokf`。所以 24ezgo-ops Worker 手上的 service role 已經寫得到 `public`，不一定需要另開 Edge Function；但讓營運平台的 Worker 直接寫相揪的表，等於擴大它的權限範圍，grill 時要決定走 Edge Function（邊界清楚）或直接寫（少一層）。

| 部分 | 所在 |
|---|---|
| webhook、預篩、抽取 | 24ezgo-ops（Cloudflare Worker） |
| 待審表、審核頁、公布 | TCU約騎系統（`public` schema） |
