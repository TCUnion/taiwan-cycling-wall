import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

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

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-cork overflow-hidden">
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
  )
}
