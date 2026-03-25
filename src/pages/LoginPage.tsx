import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { 模擬使用者 } from '../data/mockUsers'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'

export default function LoginPage() {
  const navigate = useNavigate()
  const 登入 = useAuthStore(s => s.登入)
  const [選擇的ID, set選擇的ID] = useState<string | null>(null)

  const 處理登入 = () => {
    if (!選擇的ID) return
    登入(選擇的ID)
    navigate('/wall', { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-cork px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-strava mb-1">siokiu</h1>
          <p className="text-sm text-gray-500 mb-3">相揪來騎車</p>
          <p className="mt-1 text-gray-600">選擇角色開始體驗</p>
        </div>

        <div className="space-y-3 mb-6">
          {模擬使用者.map(user => (
            <button
              key={user.id}
              onClick={() => set選擇的ID(user.id)}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                選擇的ID === user.id
                  ? 'border-strava bg-strava/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Avatar emoji={user.avatar} size="md" />
              <div className="text-left">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {user.stats.totalRides} 次騎乘 · {user.stats.totalDistance} km
                </p>
              </div>
            </button>
          ))}
        </div>

        <Button fullWidth disabled={!選擇的ID} onClick={處理登入}>
          開始約騎！
        </Button>
      </div>
    </div>
  )
}
