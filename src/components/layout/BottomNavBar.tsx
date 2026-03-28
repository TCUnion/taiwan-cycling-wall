import { useLocation, useNavigate } from 'react-router-dom'
import { Home, PlusCircle, User, Shield } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

const 導航項目 = [
  { path: '/wall', icon: Home, label: '公布欄', 需登入: false, 需管理員: false },
  { path: '/create', icon: PlusCircle, label: '發起', 需登入: true, 需管理員: false },
  { path: '/dashboard', icon: User, label: '我的', 需登入: true, 需管理員: false },
  { path: '/admin', icon: Shield, label: '管理', 需登入: true, 需管理員: true },
]

export default function BottomNavBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const 已登入 = useAuthStore(s => s.已登入)
  const 是管理員 = useAuthStore(s => s.使用者?.role) === 'admin'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm safe-area-pb" style={{ touchAction: 'manipulation' }}>
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {導航項目
          .filter(item => !item.需管理員 || 是管理員)
          .map(({ path, icon: Icon, label, 需登入 }) => {
          const 啟用 = location.pathname === path ||
            (path === '/wall' && location.pathname.startsWith('/event'))
          return (
            <button
              key={path}
              onClick={() => navigate(需登入 && !已登入 ? '/login' : path)}
              aria-label={label}
              className={`flex flex-col items-center gap-0.5 px-5 py-2 min-h-[44px] min-w-[44px] cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-strava/40 focus-visible:outline-none rounded-lg ${
                啟用 ? 'text-strava' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={22} strokeWidth={啟用 ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
