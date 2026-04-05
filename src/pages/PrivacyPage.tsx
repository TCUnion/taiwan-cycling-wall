// 隱私政策頁面

import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

export default function PrivacyPage() {
  const navigate = useNavigate()
  usePageMeta('隱私政策 — 相揪約騎公布欄', '了解相揪約騎公布欄如何收集、使用及保護您的個人資料。', 'https://siokiu.criterium.tw/privacy')

  return (
    <main className="min-h-svh bg-white">
      <div className="sticky top-0 z-30 flex items-center gap-3 bg-white/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} aria-label="返回" className="p-2 -ml-1 rounded-full cursor-pointer hover:bg-black/5 transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">隱私政策</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 text-sm text-gray-700 leading-relaxed">
        <p className="text-xs text-gray-400">最後更新日期：2025 年 3 月 25 日</p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">1. 服務說明</h2>
          <p>
            「相揪約騎公布欄」（siokiu.criterium.tw，以下簡稱「本服務」）是一個台灣單車約騎社群平台，
            提供使用者發起與參加約騎活動的公布欄功能。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">2. 我們收集的資料</h2>
          <p>當你使用 Facebook 登入本服務時，我們會取得以下資料：</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>公開個人檔案</strong>：姓名、大頭照</li>
            <li><strong>家鄉 / 所在地</strong>：用於自動比對所在縣市（需使用者授權）</li>
            <li><strong>粉絲頁列表</strong>：你管理的 Facebook 粉絲頁名稱與頭像（需使用者授權，僅供身份切換功能使用）</li>
          </ul>
          <p>此外，你在本服務中主動提供的資料包括：</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>約騎活動資訊（路線、集合地點、日期等）</li>
            <li>個人偏好設定（顯示名稱、所在縣市）</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">3. 資料的使用方式</h2>
          <p>我們使用你的資料來：</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>提供登入與身份驗證功能</li>
            <li>顯示你的公開個人資訊於活動頁面</li>
            <li>依據所在地推薦相關約騎活動</li>
            <li>讓你以粉絲頁身份發起活動</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">4. 資料儲存</h2>
          <p>
            本服務的使用者資料主要儲存於你的瀏覽器本地儲存空間（localStorage）。
            我們不會將你的個人資料傳送至第三方伺服器，除了必要的 Facebook 登入驗證流程。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">5. 資料分享</h2>
          <p>
            我們不會出售、交易或出租你的個人資料給第三方。
            你在平台上發起的約騎活動資訊（路線、時間、地點）為公開資訊，其他使用者可以瀏覽。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">6. 資料刪除</h2>
          <p>
            你可以隨時透過以下方式刪除你的資料：
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>清除瀏覽器的 localStorage 即可移除所有本地資料</li>
            <li>前往 <a href="/data-deletion" className="text-strava underline">資料刪除頁面</a> 了解詳細說明</li>
            <li>在 Facebook 設定中移除本應用程式的授權</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">7. Cookie 與追蹤</h2>
          <p>
            本服務使用 Facebook SDK 進行登入驗證，Facebook 可能會設定相關 Cookie。
            除此之外，本服務不使用額外的追蹤技術或分析工具。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">8. 聯絡我們</h2>
          <p>
            如有任何隱私相關問題，請聯繫：
            <a href="mailto:service@tsu.com.tw" className="text-strava underline ml-1">service@tsu.com.tw</a>
          </p>
        </section>
      </div>
    </main>
  )
}
