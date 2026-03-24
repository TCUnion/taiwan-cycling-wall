import { useLocation, useNavigate } from 'react-router-dom'
import { Home, PlusCircle, User } from 'lucide-react'

const 導航項目 = [
  { path: '/wall', icon: Home, label: '約騎牆' },
  { path: '/create', icon: PlusCircle, label: '發起' },
  { path: '/dashboard', icon: User, label: '我的' },
]

export default function BottomNavBar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm safe-area-pb">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {導航項目.map(({ path, icon: Icon, label }) => {
          const 啟用 = location.pathname === path ||
            (path === '/wall' && location.pathname.startsWith('/event'))
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
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
