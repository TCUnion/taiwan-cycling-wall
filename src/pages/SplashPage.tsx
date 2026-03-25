import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

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
  const navigate = useNavigate()
  const [階段, set階段] = useState(0)
  const [正在跳轉, set正在跳轉] = useState(false)

  useEffect(() => {
    const timers = [
      setTimeout(() => set階段(1), 100),   // 圓圈 + 小點出現
      setTimeout(() => set階段(2), 600),   // siokiu 文字淡入
      setTimeout(() => set階段(3), 1200),  // 辭典解釋出現
      setTimeout(() => set階段(4), 1800),  // CTA 按鈕出現
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const 處理進入 = () => {
    set正在跳轉(true)
    setTimeout(() => {
      navigate(已登入 ? '/wall' : '/login')
    }, 2000) // 等動畫播完再跳轉
  }

  return (
    <main className="flex flex-col items-center bg-cream overflow-hidden">

      {/* ===== 主視覺區：佔滿整個視窗高度 ===== */}
      <section className="relative flex flex-col items-center justify-center w-full min-h-svh px-6">

        {/* 大圓圈 + 軌道小點 */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all ${
            正在跳轉
              ? 'scale-[8] opacity-0 duration-2000'
              : 階段 >= 1
                ? 'opacity-100 scale-100 duration-1000'
                : 'opacity-0 scale-100 duration-1000'
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
        <div className={`relative z-10 flex flex-col items-center transition-all duration-500 ${
          正在跳轉 ? 'opacity-0 scale-110' : ''
        }`}>

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
            <button
              onClick={處理進入}
              disabled={正在跳轉}
              className="rounded-full bg-strava px-8 py-3 text-lg font-bold text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {已登入 ? '明天騎哪裡' : '來去相揪 →'}
            </button>
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

      {/* SEO 隱藏文字（僅供搜尋引擎） */}
      <section className="sr-only" aria-hidden="true">
        <h2>台灣單車約騎社群平台</h2>
        <p>Siokiu（相揪）是台語「互相邀約」的意思。專為台灣單車愛好者打造的約騎平台，涵蓋北部、中部、南部、東部共 22 縣市。</p>
      </section>
    </main>
  )
}
