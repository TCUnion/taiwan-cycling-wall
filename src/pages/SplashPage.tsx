import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

import { 模擬活動 } from '../data/mockEvents'

export default function SplashPage() {
  const navigate = useNavigate()
  const 已登入 = useAuthStore(s => s.已登入)
  const [顯示, set顯示] = useState(false)

  useEffect(() => {
    // 觸發進場動畫
    requestAnimationFrame(() => set顯示(true))

    const timer = setTimeout(() => {
      navigate(已登入 ? '/wall' : '/login', { replace: true })
    }, 2500)
    return () => clearTimeout(timer)
  }, [navigate, 已登入])

  // 取前 6 筆活動作為近期活動摘要
  const 近期活動 = 模擬活動.slice(0, 6)

  return (
    <main className="flex min-h-svh flex-col items-center bg-cork overflow-hidden">
      {/* 原有動畫 Splash 區塊 */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className={`flex flex-col items-center gap-6 transition-all duration-1000 ${
          顯示 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* 台灣輪廓 SVG */}
          <div className="relative">
            <svg viewBox="0 0 120 200" className="w-28 h-44" aria-label="台灣地圖">
              <path
                d="M60 10 C55 15, 45 25, 40 40 C35 55, 30 70, 32 85 C34 100, 28 115, 30 130 C32 145, 35 155, 40 165 C45 175, 55 185, 60 190 C65 185, 75 175, 80 165 C85 155, 88 145, 90 130 C92 115, 86 100, 88 85 C90 70, 85 55, 80 40 C75 25, 65 15, 60 10Z"
                fill="none"
                stroke="#8B6914"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-[draw_2s_ease-in-out_forwards]"
                style={{
                  strokeDasharray: 600,
                  strokeDashoffset: 顯示 ? 0 : 600,
                  transition: 'stroke-dashoffset 2s ease-in-out',
                }}
              />
            </svg>
            {/* 騎行者圖示 */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl transition-all duration-700 delay-700 ${
              顯示 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}>
              🚴
            </div>
          </div>

          <div className={`text-center transition-all duration-700 delay-500 ${
            顯示 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h1 className="text-3xl font-bold text-gray-800">台灣約騎事件簿</h1>
            <p className="mt-2 text-gray-600">找人一起騎車吧！</p>
          </div>

          {/* 載入指示器 */}
          <div className={`flex gap-1.5 transition-opacity duration-500 delay-1000 ${
            顯示 ? 'opacity-100' : 'opacity-0'
          }`}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-strava animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* SEO 內容區塊 — 預渲染與一般訪問都顯示 */}
      <section className="w-full max-w-2xl px-6 pb-12 pt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">台灣單車約騎社群平台</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          台灣約騎事件簿是專為台灣單車愛好者打造的約騎平台。
          無論你是公路車、登山車還是休閒騎乘，都能在這裡找到志同道合的車友。
          涵蓋北部、中部、南部、東部共 22 縣市，輕鬆瀏覽各地約騎活動。
        </p>

        <h3 className="text-lg font-semibold text-gray-800 mb-3">平台特色</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1 mb-6">
          <li>便利貼風格約騎牆，一目瞭然瀏覽各地活動</li>
          <li>支援台灣 22 縣市四大區域篩選</li>
          <li>Strava 路線整合，輕鬆預覽騎乘路線</li>
          <li>經典路線模板，快速建立約騎活動</li>
          <li>個人騎乘統計與成就系統</li>
          <li>PWA 支援，手機安裝如原生 App</li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-800 mb-3">近期約騎活動</h3>
        <ul className="space-y-2 mb-8">
          {近期活動.map(活動 => (
            <li key={活動.id} className="text-gray-700">
              <span className="font-medium">{活動.title}</span>
              {' — '}
              <span className="text-gray-500">{活動.region}・{活動.distance} km・{活動.date}</span>
            </li>
          ))}
        </ul>

        <nav className="flex gap-4">
          <Link
            to="/wall"
            className="inline-block rounded-lg bg-strava px-6 py-2.5 font-semibold text-white hover:opacity-90"
          >
            瀏覽約騎牆
          </Link>
          <Link
            to="/login"
            className="inline-block rounded-lg border-2 border-gray-400 px-6 py-2.5 font-semibold text-gray-700 hover:border-gray-600"
          >
            登入
          </Link>
        </nav>
      </section>
    </main>
  )
}
