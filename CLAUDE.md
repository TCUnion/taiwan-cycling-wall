# 台灣約騎事件簿 — CLAUDE.md

## 專案概述

台灣單車約騎社群平台 PWA，以軟木佈告欄 + 便利貼風格呈現約騎活動，支援台灣 22 縣市區域篩選。全繁體中文介面。

## 技術棧

- **Vite 8** + **React 19** + **TypeScript**
- **Tailwind CSS v4**（使用 `@tailwindcss/vite` 插件，設定在 `src/index.css` 的 `@theme` 區塊）
- **Zustand**（狀態管理 + localStorage 持久化）
- **React Router v7**
- **Lucide React**（圖示）
- **html-to-image**（OG 分享圖片生成）
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

## 專案結構

```
src/
├── types/index.ts          # 所有 TS 介面（County, CyclingEvent, User 等）
├── data/                   # 靜態資料
│   ├── counties.ts         # 22 縣市 + 區域對照
│   ├── classicRoutes.ts    # 7 條經典路線模板
│   ├── mockEvents.ts       # 18 筆模擬活動
│   └── mockUsers.ts        # 5 位模擬使用者
├── stores/                 # Zustand stores（均使用 persist middleware）
│   ├── authStore.ts        # 登入狀態
│   ├── eventStore.ts       # 活動 CRUD + 篩選排序
│   └── regionStore.ts      # 區域/縣市選擇
├── hooks/                  # 自訂 hooks
├── utils/                  # 工具函式（格式化、區域對照、OG 圖片常數）
├── components/
│   ├── ui/                 # Button, Input, Card, Badge, Modal, Avatar
│   ├── layout/             # AppShell, BottomNavBar, RegionTabs
│   ├── wall/               # CorkBoard, StickyNoteCard, WallFilters
│   ├── event/              # CountyPicker, RouteTemplatePicker, ParticipantMap, MoakBadge
│   ├── share/              # OGImageGenerator
│   └── dashboard/          # StatsCard, AchievementGrid, RideTimeline
└── pages/                  # 7 個頁面（均為 lazy-loaded）
```

## 路由

| 路徑 | 頁面 | 需登入 |
|------|------|--------|
| `/` | SplashPage（2.5 秒後自動跳轉） | 否 |
| `/login` | LoginPage（選擇模擬角色） | 否 |
| `/wall` | WallPage（約騎牆主頁面） | 是 |
| `/create` | CreateEventPage（三步驟表單） | 是 |
| `/event/:id` | EventDetailPage | 是 |
| `/event/:id/share` | SharePage（OG 圖片 + 分享） | 是 |
| `/dashboard` | DashboardPage（個人統計 + 成就） | 是 |

## 設計系統色彩（定義在 src/index.css @theme）

- `strava` (#FC4C02) — 主要強調色
- `line` (#00B900) — LINE 分享按鈕
- `region-north/central/south/east` — 四區域色（藍/橘/紅/綠）
- `cork` (#D4A574) — 佈告欄背景
- `sticky-yellow/pink/blue/green` — 便利貼色

## 資料持久化

使用 Zustand `persist` middleware → localStorage。Store key：
- `約騎-auth` — 登入狀態
- `約騎-events` — 活動列表
- `約騎-region` — 區域選擇

首次載入從 mockEvents/mockUsers 取得種子資料。

## 外部連結（不需 API Key）

- Google Maps：透過 URL scheme 開啟（`google.com/maps/search/?api=1&query=...`）
- Strava：直接連結路線頁面
- MOAK：連結活動頁面
- LINE：使用 `social-plugins.line.me/lineit/share` 分享

## 回應語言

- **一律使用繁體中文**回覆與說明，包含 commit 訊息、程式碼註解、終端輸出摘要等
- React 元件名稱與 JSX 限制的部分仍用英文
