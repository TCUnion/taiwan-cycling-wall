// 資料刪除指示頁面

import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

export default function DataDeletionPage() {
  const navigate = useNavigate()
  usePageMeta('資料刪除 — 相揪約騎公布欄', '了解如何刪除您在相揪約騎公布欄上的帳號與個人資料。')

  return (
    <main className="min-h-svh bg-white">
      <div className="sticky top-0 z-30 flex items-center gap-3 bg-white/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} aria-label="返回" className="p-2 -ml-1 rounded-full cursor-pointer hover:bg-black/5 transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">資料刪除</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 text-sm text-gray-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">如何刪除你的資料</h2>
          <p>
            「相揪約騎公布欄」尊重你的隱私權。你可以隨時刪除你在本服務中的所有資料。
            由於本服務的資料主要儲存在你的瀏覽器本地儲存空間（localStorage），
            你可以透過以下方式完全刪除：
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">方法一：在應用程式內登出</h2>
          <p>登入後前往「個人中心」，點擊右上角的登出按鈕即可清除登入狀態。</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">方法二：清除瀏覽器資料</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>開啟瀏覽器設定</li>
            <li>找到「清除瀏覽資料」或「清除網站資料」</li>
            <li>選擇清除 <strong>siokiu.criterium.tw</strong> 的網站資料</li>
            <li>確認清除</li>
          </ol>
          <p>這會移除以下所有本地資料：</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>登入狀態與個人資訊</li>
            <li>發起的約騎活動</li>
            <li>儲存的範本</li>
            <li>區域偏好設定</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">方法三：移除 Facebook 應用程式授權</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>前往 <a href="https://www.facebook.com/settings/?tab=applications" target="_blank" rel="noopener noreferrer" className="text-strava underline">Facebook 設定 &gt; 應用程式和網站</a></li>
            <li>找到「相揪約騎公布欄」</li>
            <li>點擊「移除」</li>
          </ol>
          <p>這會撤銷本服務對你 Facebook 帳號的存取權限。</p>
        </section>

        <section className="space-y-2 rounded-lg bg-gray-50 p-4">
          <h2 className="text-base font-bold text-gray-900">資料保留說明</h2>
          <p>
            本服務不會在遠端伺服器保留你的個人資料。所有使用者資料皆儲存於瀏覽器本地端，
            清除後即完全刪除，無法復原。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">聯絡我們</h2>
          <p>
            如有資料刪除相關問題，請聯繫：
            <a href="mailto:service@tsu.com.tw" className="text-strava underline ml-1">service@tsu.com.tw</a>
          </p>
        </section>
      </div>
    </main>
  )
}
