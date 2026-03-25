import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { 模擬活動 } from '../data/mockEvents'

/* 軌道上的小圓點設定 */
const 軌道點 = [
  { size: 6,  duration: 10, delay: 0,    color: '#FC4C02' },
  { size: 4,  duration: 14, delay: -3,   color: '#D4A574' },
  { size: 8,  duration: 18, delay: -7,   color: '#FC4C02' },
  { size: 5,  duration: 12, delay: -1,   color: '#B8895A' },
  { size: 3,  duration: 16, delay: -9,   color: '#FC4C02' },
  { size: 7,  duration: 20, delay: -5,   color: '#D4A574' },
  { size: 4,  duration: 9,  delay: -12,  color: '#B8895A' },
  { size: 6,  duration: 15, delay: -4,   color: '#FC4C02' },
  { size: 3,  duration: 11, delay: -8,   color: '#D4A574' },
  { size: 5,  duration: 17, delay: -2,   color: '#B8895A' },
]

export default function SplashPage() {
  const 已登入 = useAuthStore(s => s.已登入)
  const [階段, set階段] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => set階段(1), 100),   // 圓圈 + 小點出現
      setTimeout(() => set階段(2), 600),   // siokiu 文字淡入
      setTimeout(() => set階段(3), 1200),  // 辭典解釋出現
      setTimeout(() => set階段(4), 1800),  // CTA 按鈕出現
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const 近期活動 = 模擬活動.slice(0, 6)

  return (
    <main className="flex flex-col items-center bg-cream overflow-hidden">

      {/* ===== 主視覺區：佔滿整個視窗高度 ===== */}
      <section className="relative flex flex-col items-center justify-center w-full min-h-svh px-6">

        {/* 大圓圈 + 軌道小點 */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
            階段 >= 1 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* 淡灰色細線描邊圓 */}
          <div
            className="rounded-full border border-gray-300/50"
            style={{ width: 'min(70vw, 420px)', height: 'min(70vw, 420px)' }}
          />

          {/* 繞圈小點 */}
          <div
            className="absolute"
            style={{ width: 'min(70vw, 420px)', height: 'min(70vw, 420px)' }}
          >
            {軌道點.map((dot, i) => (
              <span
                key={i}
                className="absolute rounded-full"
                style={{
                  width: dot.size,
                  height: dot.size,
                  backgroundColor: dot.color,
                  opacity: 0.6,
                  top: '50%',
                  left: '50%',
                  marginTop: -dot.size / 2,
                  marginLeft: -dot.size / 2,
                  '--orbit-radius': 'calc(min(35vw, 210px))',
                  animation: `orbit ${dot.duration}s linear infinite`,
                  animationDelay: `${dot.delay}s`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        </div>

        {/* 文字內容（置於圓圈之上） */}
        <div className="relative z-10 flex flex-col items-center">

          {/* siokiu 大字 + 相揪 */}
          <div
            className={`relative transition-all duration-1000 ${
              階段 >= 2
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-6'
            }`}
          >
            <h1
              className="font-serif text-7xl sm:text-8xl md:text-9xl text-gray-900 tracking-tight leading-none select-none"
            >
              siokiu
            </h1>
            {/* 右上角紅色「相揪」 */}
            <span
              className="absolute -top-2 -right-10 sm:-right-14 text-strava font-bold text-lg sm:text-xl"
            >
              相揪
            </span>
          </div>

          {/* 辭典式解釋框 */}
          <div
            className={`mt-8 sm:mt-10 border border-gray-400/60 rounded-lg px-5 py-3 max-w-xs sm:max-w-sm text-center transition-all duration-800 ${
              階段 >= 3
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
          >
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-800">台語</span>
              <span className="mx-1.5 text-gray-400">·</span>
              <span className="text-gray-500">動詞</span>
              <span className="mx-1.5 text-gray-400">｜</span>
              <span className="text-gray-800">相揪，呼朋引伴一起騎車</span>
            </p>
          </div>

          {/* CTA 按鈕 */}
          <div
            className={`flex flex-col items-center gap-3 mt-8 sm:mt-10 transition-all duration-700 ${
              階段 >= 4
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-6'
            }`}
          >
            <Link
              to={已登入 ? '/wall' : '/login'}
              className="rounded-full bg-strava px-8 py-3 text-lg font-bold text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              {已登入 ? '明天騎哪裡' : '來去相揪 →'}
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
      </section>

      {/* ===== SEO 內容區塊 ===== */}
      <section className="w-full max-w-2xl px-6 pb-12 pt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">台灣單車約騎社群平台</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Siokiu（相揪）是台語「互相邀約」的意思。
          這裡是專為台灣單車愛好者打造的約騎平台——
          無論你騎公路車、登山車還是休閒車，攏總來相揪！
          涵蓋北部、中部、南部、東部共 22 縣市，輕鬆瀏覽各地約騎活動。
        </p>

        <h3 className="text-lg font-semibold text-gray-800 mb-3">平台特色</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1 mb-6">
          <li>便利貼風格約騎公布欄，一目瞭然瀏覽各地活動</li>
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
            瀏覽約騎公布欄
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
