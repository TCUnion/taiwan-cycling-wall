import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { 模擬活動 } from '../data/mockEvents'

export default function SplashPage() {
  const 已登入 = useAuthStore(s => s.已登入)
  const [階段, set階段] = useState(0)

  useEffect(() => {
    // 逐步觸發動畫階段
    const timers = [
      setTimeout(() => set階段(1), 100),   // siokiu 文字淡入
      setTimeout(() => set階段(2), 800),   // 騎士們聚攏
      setTimeout(() => set階段(3), 1600),  // 中文解釋出現
      setTimeout(() => set階段(4), 2400),  // 按鈕與內容出現
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const 近期活動 = 模擬活動.slice(0, 6)

  return (
    <main className="flex min-h-svh flex-col items-center bg-cork overflow-hidden">
      {/* 主視覺動畫區 */}
      <div className="flex flex-col items-center justify-center pt-16 pb-8 px-6">

        {/* siokiu 大字 — 台語拼音 */}
        <h1
          className={`text-6xl sm:text-7xl font-black tracking-tight transition-all duration-1000 ${
            階段 >= 1
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-75 translate-y-6'
          }`}
          style={{
            background: 'linear-gradient(135deg, #FC4C02 0%, #FF8A50 50%, #FC4C02 100%)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 階段 >= 1 ? 'shimmer 3s ease-in-out infinite' : 'none',
          }}
        >
          siokiu
        </h1>

        {/* 騎士相揪動畫 — 三個騎士從兩側聚攏到中間 */}
        <div className="relative h-20 w-64 my-6">
          {/* 左側騎士 */}
          <span
            className={`absolute top-1/2 -translate-y-1/2 text-4xl transition-all duration-1000 ease-out ${
              階段 >= 2
                ? 'left-[25%] opacity-100'
                : 'left-0 opacity-0'
            }`}
          >
            🚴
          </span>
          {/* 中間騎士 */}
          <span
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl transition-all duration-700 delay-200 ${
              階段 >= 2
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-0'
            }`}
          >
            🤝
          </span>
          {/* 右側騎士 */}
          <span
            className={`absolute top-1/2 -translate-y-1/2 text-4xl transition-all duration-1000 ease-out ${
              階段 >= 2
                ? 'right-[25%] opacity-100 -scale-x-100'
                : 'right-0 opacity-0 -scale-x-100'
            }`}
          >
            🚴
          </span>
        </div>

        {/* 台語 + 中文解釋 */}
        <div className={`text-center transition-all duration-800 ${
          階段 >= 3
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        }`}>
          <p className="text-xl font-bold text-gray-800">
            <ruby className="text-strava">相揪<rp>(</rp><rt>siō-kiu</rt><rp>)</rp></ruby>
            {' '}來騎車
          </p>
          <p className="mt-2 text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">
            台語「相揪」，就是互相邀約、呼朋引伴的意思。<br />
            揪車友、找路線、一起踩踏板！
          </p>
        </div>

        {/* CTA 按鈕 */}
        <div className={`flex flex-col items-center gap-3 mt-8 transition-all duration-700 ${
          階段 >= 4
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-6'
        }`}>
          <Link
            to={已登入 ? '/wall' : '/login'}
            className="rounded-full bg-strava px-8 py-3 text-lg font-bold text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            {已登入 ? '進入約騎牆' : '來去相揪 →'}
          </Link>
          {!已登入 && (
            <Link
              to="/wall"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              先逛逛看
            </Link>
          )}
        </div>
      </div>

      {/* 三個特色卡片 */}
      <section className={`w-full max-w-lg px-6 py-8 transition-all duration-700 delay-300 ${
        階段 >= 4 ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { emoji: '📌', label: '揪團約騎', desc: '發起活動' },
            { emoji: '🗺️', label: '全台路線', desc: '22 縣市' },
            { emoji: '🏆', label: '騎乘成就', desc: '累積里程' },
          ].map((item, i) => (
            <div
              key={item.label}
              className="rounded-xl bg-white/60 backdrop-blur p-3 shadow-sm"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="text-2xl mb-1">{item.emoji}</div>
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SEO 內容區塊 */}
      <section className="w-full max-w-2xl px-6 pb-12 pt-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">台灣單車約騎社群平台</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Siokiu（相揪）是台語「互相邀約」的意思。
          這裡是專為台灣單車愛好者打造的約騎平台——
          無論你騎公路車、登山車還是休閒車，攏總來相揪！
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
