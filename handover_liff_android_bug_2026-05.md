# LIFF Android 26.6.0 / 26.6.1 異常版本處理 Handover

日期：2026-05-12
公告來源：https://developers.line.biz/en/news/2026/?month=05&day=11&article=liff-outage

## 背景

LINE 官方於 2026-05-11 發布通知，LINE for Android **26.6.0** 與 **26.6.1** 版本在以下條件同時成立時，會觸發 LIFF Bug：

- 使用 LINE for Android
- 版本為 26.6.0 或 26.6.1
- 透過 Intent 或 App Links 開啟 LIFF / LINE MINI App
- 同時還有另一個 LIFF 實例處於開啟狀態

症狀：
1. `liff.getProfile()` 無法取得使用者個人資料
2. LIFF API 整體運作不正常

本專案 `siokiu` 透過 `https://siokiu.criterium.tw/liff/verify` 做 LINE 車手身份認證，使用 `liff.getProfile()` 取得 `userId`，正好踩在 Bug 觸發路徑上。

## 本次處理

### 變更檔案

1. **`src/utils/liff.ts`**
   - 新增常數 `已知異常_ANDROID_LINE版本 = ['26.6.0', '26.6.1']`
   - 新增 `檢查LIFF環境()` 函式，回傳 `{ 是否異常版本, os, lineVersion, 訊息 }`
   - `取得LINE使用者()` 失敗時記錄是否為已知異常版本

2. **`src/pages/LiffVerifyPage.tsx`**
   - import `檢查LIFF環境`
   - `init()` 流程在 `取得LINE使用者()` 回傳 null 時，先判斷是否異常版本 → 顯示「請更新 LINE App 或改用其他裝置」友善提示，而非無聲卡在「載入中」

3. **`CLAUDE.md`**
   - 在「TCU 認證（LINE LIFF）」段補上 Bug 說明連結

### 行為對照

| 情境 | 修正前 | 修正後 |
|------|--------|--------|
| 正常 LINE / iOS | 正常驗證 | 正常驗證 |
| Android 非 26.6.x | 正常驗證 | 正常驗證 |
| Android 26.6.0/26.6.1 且踩 Bug | 卡在「載入中」白畫面 | 顯示提示：請更新 LINE App 或改用其他裝置 |
| 未從 LINE 開啟 | 顯示 LIFF 初始化失敗 | 顯示 LIFF 初始化失敗（不變） |

## 後續觀察

- LINE 官方修復後，可移除 `已知異常_ANDROID_LINE版本` 陣列內容（保留函式以便未來重用）
- 若有 Sentry / 日誌系統，建議加上「LIFF 失敗 + os/lineVersion」事件，量化影響使用者數
- worktree `nice-jackson` 分支未一併修改，合併主分支時會自動同步

## 驗證指引

```bash
cd "/Volumes/OWC 2T/ClaudeCode/約騎系統"
npm run build       # 確認 TS 編譯通過
npm run dev         # 瀏覽器測試（環境會回 是否異常版本=false）
```

實機驗證需 LINE for Android 26.6.0/26.6.1，難以本地重現，以 unit test mock `liff.getOS()` / `liff.getLineVersion()` 為佳。
