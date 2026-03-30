# 約騎公布欄 — CLAUDE.md

## 專案概述

台灣單車約騎社群平台 PWA（siokiu），以軟木佈告欄 + 便利貼風格呈現約騎活動，支援台灣 22 縣市區域篩選。全繁體中文介面。

正式網址：`https://siokiu.criterium.tw/`

## 技術棧

- **Vite 8** + **React 19** + **TypeScript**
- **Tailwind CSS v4**（使用 `@tailwindcss/vite` 插件，設定在 `src/index.css` 的 `@theme` 區塊）
- **Zustand**（狀態管理 + localStorage 持久化）
- **React Router v7**
- **Lucide React**（圖示 — 禁止使用 emoji 作為 UI icon）
- **Facebook JavaScript SDK**（登入驗證）
- **Google Identity Services**（Google 登入，前端 JWT 解碼）
- **LINE Login**（OAuth 2.0 + PKCE）
- **Strava OAuth**（redirect → n8n 後端換 token）
- **@supabase/supabase-js**（Supabase 客戶端 — 自架實例 `db.criterium.tw`）
- **@line/liff**（LINE LIFF SDK — TCU 認證用）
- **date-fns**（日期格式化）
- **vite-plugin-pwa**（PWA / Service Worker）

## 常用指令

```bash
npm run dev      # 開發伺服器
npm run build    # TypeScript 檢查 + 生產建置
npm run preview  # 預覽生產建置
npm run lint     # ESLint 檢查
```

## 程式碼慣例

- **語言**：註解、變數名稱盡量使用繁體中文；React 元件名用英文（JSX 限制）
- **Zustand store** 中的 state/action 使用繁體中文命名（如 `使用者`、`登入`、`活動列表`）
- **Tailwind** 自訂色彩定義在 `src/index.css` 的 `@theme` 區塊（非 tailwind.config.js）
- **路由保護**：需登入頁面透過 `RequireAuth` 元件包裹（在 `App.tsx`）
- **頁面延遲載入**：所有頁面使用 `React.lazy()` + `Suspense`
- **便利貼旋轉**：以 `hashCode(id) % 5 - 2` 度計算，class 為 `sticky-rotate-{n2|n1|0|1|2}`
- **圖示**：一律使用 Lucide React SVG icon，禁止用 emoji（🚴❌ → `<Bike>` ✅）
- **無障礙**：icon-only 按鈕必須加 `aria-label`；所有可點擊元素加 `cursor-pointer`
- **動畫**：全域支援 `prefers-reduced-motion: reduce`；transition 使用 150-300ms
- **安全性**：注意事項/備註欄位禁止輸入 http/https 連結，提交時自動過濾

## 專案結構

```
src/
├── types/index.ts          # TS 介面（County, CyclingEvent, User, AuthProvider, StravaProfile, PageIdentity, RideTemplate, SpotTemplate, RouteInfoTemplate, NotesTemplate, SavedRoute, MeetingSpot, FollowRelation, UserVerification 等）
├── data/                   # 靜態 / mock 資料
│   ├── counties.ts         # 22 縣市 + 區域對照 + 查找函式
│   ├── classicRoutes.ts    # 7 條經典路線模板
│   ├── mockEvents.ts       # 18 筆模擬活動
│   └── mockUsers.ts        # 5 位模擬使用者 + 收藏路線 / 集合點 / 追蹤粉絲 mock 資料
├── stores/                 # Zustand stores（均使用 persist middleware）
│   ├── authStore.ts        # 登入狀態（FB / Google / LINE / Strava 登入 / 一般註冊 / 所有使用者列表 / 粉絲頁身份切換）
│   ├── eventStore.ts       # 活動 CRUD（新增 / 更新 / 載入單一活動）+ 篩選排序 + 歷史活動
│   ├── templateStore.ts    # 約騎範本 CRUD（新增 / 刪除 / 更新）
│   ├── spotTemplateStore.ts    # 集合點範本 CRUD（Supabase: spot_templates）
│   ├── routeInfoTemplateStore.ts # 路線與騎乘資訊範本 CRUD（Supabase: route_info_templates）
│   ├── notesTemplateStore.ts   # 注意事項範本 CRUD（Supabase: notes_templates）
│   └── regionStore.ts      # 區域/縣市選擇
├── hooks/                  # 自訂 hooks
│   ├── useAds.ts           # 從 Supabase 抓取廣告（tcuad_internal_placements + tcuad_placements）
│   └── useVerificationPolling.ts  # TCU 認證狀態輪詢（每 3 秒，10 分鐘自動停止）
├── utils/
│   ├── formatters.ts       # 格式化（日期、距離、產生 ID）
│   ├── regionMapping.ts    # 區域色對照
│   ├── facebook.ts         # Facebook SDK 載入、登入、取得使用者資訊、取得粉絲頁列表
│   ├── google.ts           # Google GIS SDK 載入、登入、JWT 解碼
│   ├── line.ts             # LINE Login PKCE（redirect + token 交換 + id_token 解碼）
│   ├── strava.ts           # Strava OAuth redirect + n8n 後端換 token
│   ├── pkce.ts             # PKCE 共用工具（SHA-256 + base64url + 隨機字串）
│   ├── supabase.ts         # Supabase client 初始化
│   ├── ogConstants.ts      # OG 圖片常數
│   ├── verificationService.ts  # TCU 認證服務（建立請求 / 驗證碼比對 / 狀態查詢）
│   └── liff.ts             # LINE LIFF SDK 封裝（初始化 / 取得使用者 / 關閉）
├── components/
│   ├── ui/                 # Button, Input, Card, Badge, Modal, Avatar（支援 URL 圖片）, SocialLoginButton, VerifiedBadge
│   ├── layout/             # AppShell, BottomNavBar, RegionTabs
│   ├── dashboard/          # VerificationSection（TCU 認證區塊）
│   ├── wall/               # CorkBoard, StickyNoteCard, WallFilters, AdCard（廣告卡片）
│   └── event/              # CountyPicker, RouteTemplatePicker, ParticipantMap, MoakBadge
├── pages/                  # 頁面（均為 lazy-loaded）
functions/
└── event/[[id]].ts         # Cloudflare Pages Function（社群媒體爬蟲動態 OG meta）
```

## 路由

| 路徑 | 頁面 | 需登入 |
|------|------|--------|
| `/` | SplashPage（2.5 秒後自動跳轉） | 否 |
| `/login` | LoginPage（Facebook / Google / LINE / Strava 登入） | 否 |
| `/privacy` | PrivacyPage（隱私政策） | 否 |
| `/data-deletion` | DataDeletionPage（資料刪除指示） | 否 |
| `/wall` | WallPage（約騎公布欄主頁面） | 是 |
| `/create` | CreateEventPage（發起約騎） | 是 |
| `/event/:id` | EventDetailPage | 是 |
| `/event/:id/edit` | CreateEventPage（編輯模式） | 是 |
| `/event/:id/share` | SharePage（活動資訊卡片 + 分享連結 / LINE） | 是 |
| `/history` | HistoryPage（過期活動歷史紀錄） | 是 |
| `/dashboard` | DashboardPage（單頁滾動式個人中心） | 是 |
| `/auth/callback` | OAuthCallbackPage（LINE / Strava OAuth 回調） | 否 |
| `/liff/verify` | LiffVerifyPage（LINE LIFF TCU 認證頁面） | 否 |

## 登入機制

支援四種社群登入，各自獨立帳號（後續可合併）：

| Provider | User ID 格式 | 登入方式 |
|----------|-------------|---------|
| Facebook | `fb-{fbId}` | 前端 JS SDK |
| Google | `google-{sub}` | 前端 GIS library，JWT 直接解碼 |
| LINE | `line-{userId}` | OAuth 2.0 + PKCE redirect |
| Strava | `strava-{athleteId}` | OAuth 2.0 redirect → n8n 後端換 token |

### Facebook Login
- JavaScript SDK，版本 v21.0
- 權限：`public_profile`、`user_hometown`、`user_location`
- 首次 FB 登入自動建立使用者
- 從 FB hometown/location 自動比對台灣縣市（含常見地名英中對照）

### Google Login
- Google Identity Services (GIS) One Tap 流程
- 前端直接取得 JWT（id_token），解碼取 sub/name/picture/email
- JWT 解碼需用 `decodeURIComponent` + 逐位元組 `%XX` 處理 UTF-8 中文

### LINE Login
- OAuth 2.0 + PKCE（code_challenge_method: S256）
- redirect 到 LINE 授權 → 回調頁面用 code 換 token → 解碼 id_token
- PKCE verifier/state 暫存於 sessionStorage

### Strava Login
- OAuth 2.0 redirect → 回調頁面帶 code → POST 到 n8n webhook 換 token
- n8n 後端處理 client_secret + token 交換，回傳 athlete 資訊
- state 暫存於 sessionStorage

### 共用機制
- Avatar 元件支援 emoji 字元與圖片 URL（FB / Google / LINE / Strava 大頭照）
- `SocialLoginButton` 共用按鈕元件（各平台 SVG logo + 品牌色）
- `OAuthCallbackPage` 依 sessionStorage 中的 state key 判斷回調來源（LINE / Strava）
- 未設定 Client ID 的平台按鈕自動 disabled

### 粉絲頁身份切換

- 使用者可在個人中心切換為管理的 Facebook 粉絲頁身份發起活動
- `PageIdentity` 介面：`{ pageId, name, pictureUrl }`
- `User` 擴充欄位：`managedPages?: PageIdentity[]`、`activePageId?: string`
- authStore 新增：`目前身份`（personal/page）、`使用中的粉絲頁`、`切換到粉絲頁()`、`切換回個人()`、`取得目前發文身份()`
- `creatorId` 格式：個人 `fb-{fbId}`、粉絲頁 `page-{pageId}`
- 粉絲頁列表目前透過手動設定（FB Pages API 需 Business 類型 App + 審查）
- StickyNoteCard / EventDetailPage 支援 `page-` 開頭的 creatorId 顯示粉絲頁身份

### TCU 認證（LINE LIFF）

透過 TCU LINE@ 官方帳號（`https://page.line.me/criterium`）進行身份認證：

- **認證流程**：個人中心「申請 TCU 認證」→ 產生 6 位數認證碼（10 分鐘效期）→ 前往 LINE@ 開啟 LIFF 頁面 → 輸入認證碼 → 驗證成功
- **LIFF URL**：`https://liff.line.me/{LIFF_ID}`，Endpoint: `https://siokiu.criterium.tw/liff/verify`
- **Supabase 表**：`user_verifications`（token / status / user_id / line_user_id）
- **User 擴充欄位**：`verifiedAt?: string`、`lineVerifiedUserId?: string`
- **VerifiedBadge**：Lucide `ShieldCheck` 圖示（emerald-600），`sm`（14px）/ `md`（16px）
- **Badge 顯示位置**：StickyNoteCard 發起人旁、EventDetailPage 發起人旁、DashboardPage 認證區塊
- **輪詢機制**：`useVerificationPolling` hook，每 3 秒查詢，10 分鐘後自動停止
- **服務**：`verificationService.ts`（建立認證請求 / 驗證認證碼 / 查詢認證狀態）
- **LIFF 封裝**：`liff.ts`（初始化LIFF / 取得LINE使用者 / 關閉LIFF）

## 發起約騎表單（CreateEventPage）

表單區塊順序：
1. **日期與時間** — 約騎日期（必填）+ 集合時間
2. **發起人 + 活動圖章** — 左右排列，不可編輯；發起人顯示頭像+名稱，圖章自動使用個人中心設定的 `stampImage`
3. **集合地點** — 地點名稱 + Google Maps 連結 + 縣市（從路線名/集合點自動推斷）+ 右上角集合點範本按鈕
4. **路線與騎乘資訊** — 合併為一個區塊：路線名稱（必填）+ 路線描述（6 行）+ 路線連結 + 分隔線 + 距離/爬升/配速/人數上限 + 右上角路線範本按鈕
5. **注意事項 / 備註** — 單一 textarea，Enter 斷行，支援 Markdown，禁止 http 連結 + 右上角備註範本按鈕

### 全域約騎範本（Supabase: ride_templates）
- 右上角書籤按鈕：從已儲存範本快速填入
- 右上角書籤+按鈕：把當前表單儲存為範本
- 範本儲存路線/集合點/騎乘資訊/注意事項，不含日期

### 區塊範本功能（各自獨立，存入 Supabase）
各區塊右上角有範本按鈕，點擊展開/收合範本面板，支援新增、套用、inline 編輯、刪除：
- **集合點範本**（`spot_templates`）— 儲存地點名稱 + Google Maps 連結 + 縣市
- **路線與騎乘資訊範本**（`route_info_templates`）— 儲存路線名稱/描述/連結 + 距離/爬升/配速/人數
- **注意事項範本**（`notes_templates`）— 儲存備註文字，名稱自動擷取前 20 字

### 編輯模式
- 路由 `/event/:id/edit` 進入編輯模式
- 自動載入既有活動資料（含從 description 反解路線描述和注意事項）
- 標題改為「編輯活動」，按鈕改為「儲存變更」
- 只有發起人能在活動詳情頁看到「編輯活動」按鈕

## 個人中心（DashboardPage）

單頁滾動式，由上到下：
1. **頂部** — 頭像 + 姓名 + 縣市 + 追蹤/粉絲數 + 登出 + 身份切換（有粉絲頁時顯示）
2. **基本資訊** — 可編輯（姓名、頭像、縣市）
3. **TCU 認證** — 未認證/認證中/已認證三種狀態（VerificationSection）
4. **社群** — 追蹤中 / 粉絲切換（mock 資料）
5. **發起紀錄** — 以 `creatorId` 篩選我建立的活動
6. **個人路線** — 收藏路線列表（mock 資料）
7. **常用集合點** — 點擊開啟 Google Maps

## 約騎公布欄便利貼（StickyNoteCard）

- 標題 + 活動圖章（右上角，固定 40×40px，與頭像同尺寸）
- 日期時間 + 集合地點含縣市 + 距離/爬升（有值才顯示）
- 參加者頭像（支援 FB 大頭照 URL）
- 區域 Badge — 僅在「全部」區域時顯示於左下角，選擇特定區域時隱藏
- 活動日期隔天凌晨後自動從公布欄消失，移入歷史頁面
- 模擬活動（`evt-` 開頭）無法參加

## 廣告系統

- 資料來源：自架 Supabase（`db.criterium.tw`）的 `tcuad_internal_placements` + `tcuad_placements`
- 只顯示 `is_active=true` 且 `image_url` 不為 null 的廣告
- `useAds` hook 抓取後隨機洗牌
- 公布欄每 5 個活動穿插 1 則廣告（循環使用），不足 5 個至少顯示 1 則
- AdCard 右上角標示「AD」，點擊開新分頁到商品頁；左側產品圖片高度撐滿 100%

## 設計系統色彩（定義在 src/index.css @theme）

- `strava` (#FC4C02) — 主要強調色 / Strava 登入按鈕
- `line` (#00B900) — LINE 分享 / 登入按鈕
- `google` (#4285F4) — Google 登入按鈕
- `facebook` (#1877F2) — Facebook 登入按鈕
- `region-north/central/south/east` — 四區域色（藍/橘/紅/綠）
- `cork` (#D4A574) — 佈告欄背景
- `sticky-yellow/pink/blue/green` — 便利貼色

## UI/UX 規範

- 所有按鈕加 `cursor-pointer` + `transition-colors duration-200`
- Button 元件內建 `focus-visible:ring` 聚焦狀態
- icon-only 按鈕加 `aria-label`
- 觸控區域最小 44×44px（BottomNavBar）
- `<select>` 加 `name` 屬性
- placeholder 結尾用 `…`（非 `...`）
- `prefers-reduced-motion: reduce` 全域支援
- BottomNavBar 加 `touch-action: manipulation`
- 活動詳情頁返回鍵導向 `/wall`（非 history back）

## 資料持久化

使用 Zustand `persist` middleware → localStorage。Store key：
- `約騎-auth` — 登入狀態 + 所有使用者列表（含 FB 登入建立的）
- `約騎-events` — 活動列表（coverImage 自動使用 stampImage）
- `約騎-region` — 區域選擇
- `約騎-templates` — 約騎範本列表

Supabase 資料表（無 persist，每次 mount 載入）：
- `ride_templates` — 全域約騎範本
- `spot_templates` — 集合點範本
- `route_info_templates` — 路線與騎乘資訊範本
- `notes_templates` — 注意事項範本
- `user_verifications` — TCU 認證記錄（token / status / user_id / line_user_id）
- `users` — 使用者表（含 `verified_at` / `line_verified_user_id` 欄位）

首次載入從 mockEvents/mockUsers 取得種子資料。

### 活動即時載入（分享連結支援）

- `eventStore.載入單一活動(id)` — 先查 store，沒有就從 Supabase 即時載入並 merge 進 store
- `EventDetailPage` / `SharePage` — 若 store 無資料會自動觸發即時載入，顯示 loading spinner
- 分享連結（`/event/{id}`）在無 localStorage 的環境下也能正常顯示

### Cloudflare Pages Function（社群媒體 OG 預覽）

- 檔案：`functions/event/[[id]].ts`
- 偵測社群爬蟲 User-Agent（LINE / Facebook / Twitter / Discord 等）
- 爬蟲：從 Supabase REST API 抓活動 → 回傳含動態 OG meta 的 HTML
- 人類：`context.next()` 正常回傳 SPA
- 環境變數：Cloudflare Pages 需設定 `SUPABASE_ANON_KEY`（非 `VITE_` 前綴）

## 環境變數

| 變數 | 說明 |
|------|------|
| `VITE_FB_APP_ID` | Facebook App ID（開發/正式共用） |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `VITE_LINE_CHANNEL_ID` | LINE Login Channel ID |
| `VITE_STRAVA_CLIENT_ID` | Strava App Client ID |
| `VITE_STRAVA_CALLBACK_URL` | Strava token 交換用的 n8n webhook URL |
| `VITE_OAUTH_REDIRECT_URI` | LINE / Strava OAuth 回調 URI |
| `VITE_SUPABASE_URL` | Supabase API URL（自架：`https://db.criterium.tw`） |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key（前端用，搭配 RLS） |
| `VITE_LIFF_ID` | LINE LIFF App ID（TCU 認證用） |

`.env` 檔案不入版控（已加入 `.gitignore`）。

### Cloudflare Pages 環境變數

| 變數 | 說明 |
|------|------|
| `SUPABASE_ANON_KEY` | Supabase anon key（供 Pages Function 伺服器端使用，與 `VITE_SUPABASE_ANON_KEY` 同值） |

## 外部連結（不需 API Key）

- Google Maps：透過 URL scheme 開啟（`google.com/maps/search/?api=1&query=...`）
- Facebook SDK：`connect.facebook.net/zh_TW/sdk.js`（動態載入）
- Google GIS：`accounts.google.com/gsi/client`（動態載入）
- LINE Login：`access.line.me`（OAuth redirect）+ `api.line.me`（token 交換）
- LINE LIFF：`liff.line.me`（TCU 認證嵌入頁面）
- LINE@：`page.line.me/criterium`（TCU 官方帳號）
- Strava OAuth：`strava.com/oauth/authorize`（redirect）+ n8n webhook（token 交換）
- Strava / Garmin Connect：路線連結（自動辨識類型顯示）
- MOAK：連結活動頁面
- LINE：使用 `social-plugins.line.me/lineit/share` 分享

## 回應語言

- **一律使用繁體中文**回覆與說明，包含 commit 訊息、程式碼註解、終端輸出摘要等
- React 元件名稱與 JSX 限制的部分仍用英文
