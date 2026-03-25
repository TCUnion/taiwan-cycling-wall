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
- **@supabase/supabase-js**（Supabase 客戶端 — 自架實例 `db.criterium.tw`）
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
├── types/index.ts          # TS 介面（County, CyclingEvent, User, RideTemplate, SavedRoute, MeetingSpot, FollowRelation 等）
├── data/                   # 靜態 / mock 資料
│   ├── counties.ts         # 22 縣市 + 區域對照 + 查找函式
│   ├── classicRoutes.ts    # 7 條經典路線模板
│   ├── mockEvents.ts       # 18 筆模擬活動
│   └── mockUsers.ts        # 5 位模擬使用者 + 收藏路線 / 集合點 / 追蹤粉絲 mock 資料
├── stores/                 # Zustand stores（均使用 persist middleware）
│   ├── authStore.ts        # 登入狀態（FB 登入 / 一般註冊 / 所有使用者列表）
│   ├── eventStore.ts       # 活動 CRUD（新增 / 更新 / 參加 / 退出）+ 篩選排序 + 歷史活動
│   ├── templateStore.ts    # 約騎範本 CRUD（新增 / 刪除 / 更新）
│   └── regionStore.ts      # 區域/縣市選擇
├── hooks/                  # 自訂 hooks
│   └── useAds.ts           # 從 Supabase 抓取廣告（tcuad_internal_placements + tcuad_placements）
├── utils/
│   ├── formatters.ts       # 格式化（日期、距離、產生 ID）
│   ├── regionMapping.ts    # 區域色對照
│   ├── facebook.ts         # Facebook SDK 載入、登入、取得使用者資訊
│   ├── supabase.ts         # Supabase client 初始化
│   └── ogConstants.ts      # OG 圖片常數
├── components/
│   ├── ui/                 # Button, Input, Card, Badge, Modal, Avatar（支援 URL 圖片）
│   ├── layout/             # AppShell, BottomNavBar, RegionTabs
│   ├── wall/               # CorkBoard, StickyNoteCard, WallFilters, AdCard（廣告卡片）
│   └── event/              # CountyPicker, RouteTemplatePicker, ParticipantMap, MoakBadge
└── pages/                  # 頁面（均為 lazy-loaded）
```

## 路由

| 路徑 | 頁面 | 需登入 |
|------|------|--------|
| `/` | SplashPage（2.5 秒後自動跳轉） | 否 |
| `/login` | LoginPage（Facebook 登入） | 否 |
| `/wall` | WallPage（約騎公布欄主頁面） | 是 |
| `/create` | CreateEventPage（發起約騎） | 是 |
| `/event/:id` | EventDetailPage | 是 |
| `/event/:id/edit` | CreateEventPage（編輯模式） | 是 |
| `/event/:id/share` | SharePage（活動資訊卡片 + 分享連結 / LINE） | 是 |
| `/history` | HistoryPage（過期活動歷史紀錄） | 是 |
| `/dashboard` | DashboardPage（單頁滾動式個人中心） | 是 |

## 登入機制

- **Facebook Login**（JavaScript SDK，版本 v21.0）
- 權限：`public_profile`、`user_hometown`、`user_location`
- App ID 存放於 `.env`（`VITE_FB_APP_ID`），不入版控
- 首次 FB 登入自動建立使用者（id 格式：`fb-{fbUserId}`）
- 從 FB hometown/location 自動比對台灣縣市（含常見地名英中對照）
- Avatar 元件支援 emoji 字元與圖片 URL（FB 大頭照）

## 發起約騎表單（CreateEventPage）

表單區塊順序：
1. **日期與時間** — 約騎日期（必填）+ 集合時間
2. **發起人** — 顯示登入者頭像，名稱可自訂
3. **封面圖片** — 選填，上傳後裁切為 400×400 正方形 PNG（支援透明背景）
4. **路線** — 路線名稱（必填）+ 路線描述（textarea）+ 路線連結（Strava / Garmin / 其他）
5. **集合地點** — 地點名稱 + Google Maps 連結 + 縣市（從路線名/集合點自動推斷）
6. **騎乘資訊** — 距離、爬升、配速、人數上限
7. **注意事項 / 備註** — 單一 textarea，Enter 斷行，支援 Markdown，禁止 http 連結

### 範本功能
- 右上角書籤按鈕：從已儲存範本快速填入
- 右上角書籤+按鈕：把當前表單儲存為範本
- 範本儲存路線/集合點/騎乘資訊/注意事項，不含日期
- 範本存於 localStorage（`約騎-templates`），依 `creatorId` 篩選

### 編輯模式
- 路由 `/event/:id/edit` 進入編輯模式
- 自動載入既有活動資料（含從 description 反解路線描述和注意事項）
- 標題改為「編輯活動」，按鈕改為「儲存變更」
- 只有發起人能在活動詳情頁看到「編輯活動」按鈕

## 個人中心（DashboardPage）

單頁滾動式，由上到下：
1. **頂部** — 頭像 + 姓名 + 縣市 + 追蹤/粉絲數 + 登出
2. **基本資訊** — 可編輯（姓名、頭像、縣市）
3. **社群** — 追蹤中 / 粉絲切換（mock 資料）
4. **發起紀錄** — 以 `creatorId` 篩選我建立的活動
5. **個人路線** — 收藏路線列表（mock 資料）
6. **常用集合點** — 點擊開啟 Google Maps

## 約騎公布欄便利貼（StickyNoteCard）

- 標題 + 封面圖片縮圖（右上角 64×64px）
- 日期時間 + 集合地點含縣市 + 距離/爬升（有值才顯示）
- 參加者頭像（支援 FB 大頭照 URL）
- 區域 Badge
- 活動日期隔天凌晨後自動從公布欄消失，移入歷史頁面
- 模擬活動（`evt-` 開頭）無法參加

## 廣告系統

- 資料來源：自架 Supabase（`db.criterium.tw`）的 `tcuad_internal_placements` + `tcuad_placements`
- 只顯示 `is_active=true` 且 `image_url` 不為 null 的廣告
- `useAds` hook 抓取後隨機洗牌
- 公布欄每 5 個活動穿插 1 則廣告（循環使用），不足 5 個至少顯示 1 則
- AdCard 右上角標示「AD」，點擊開新分頁到商品頁

## 設計系統色彩（定義在 src/index.css @theme）

- `strava` (#FC4C02) — 主要強調色
- `line` (#00B900) — LINE 分享按鈕
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
- `約騎-events` — 活動列表（含 coverImage base64）
- `約騎-region` — 區域選擇
- `約騎-templates` — 約騎範本列表

首次載入從 mockEvents/mockUsers 取得種子資料。

## 環境變數

| 變數 | 說明 |
|------|------|
| `VITE_FB_APP_ID` | Facebook App ID（開發/正式共用） |
| `VITE_SUPABASE_URL` | Supabase API URL（自架：`https://db.criterium.tw`） |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key（前端用，搭配 RLS） |

`.env` 檔案不入版控（已加入 `.gitignore`）。

## 外部連結（不需 API Key）

- Google Maps：透過 URL scheme 開啟（`google.com/maps/search/?api=1&query=...`）
- Facebook SDK：`connect.facebook.net/zh_TW/sdk.js`（動態載入）
- Strava / Garmin Connect：路線連結（自動辨識類型顯示）
- MOAK：連結活動頁面
- LINE：使用 `social-plugins.line.me/lineit/share` 分享

## 回應語言

- **一律使用繁體中文**回覆與說明，包含 commit 訊息、程式碼註解、終端輸出摘要等
- React 元件名稱與 JSX 限制的部分仍用英文
