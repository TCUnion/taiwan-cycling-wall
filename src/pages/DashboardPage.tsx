// 個人儀表板頁面 — 顯示使用者統計、縣市收集、成就徽章與騎乘紀錄

import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import StatsCard from '../components/dashboard/StatsCard'
import AchievementGrid from '../components/dashboard/AchievementGrid'
import RideTimeline from '../components/dashboard/RideTimeline'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { 使用者, 登出 } = useAuthStore()

  // 未登入時不渲染
  if (!使用者) return null

  const 處理登出 = () => {
    登出()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-svh bg-cork pb-20">
      {/* 個人資訊區 */}
      <div className="bg-white/80 backdrop-blur-sm px-4 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <Avatar emoji={使用者.avatar} size="lg" />
          <div>
            <h1 className="text-xl font-bold">{使用者.name}</h1>
            <p className="text-sm text-gray-500">
              {使用者.achievements.length} 個成就 · {使用者.stats.countiesVisited.length} 個縣市
            </p>
          </div>
          <button
            onClick={處理登出}
            className="ml-auto p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {/* 統計總覽 */}
        <div className="grid grid-cols-3 gap-3">
          <StatsCard icon="🚴" label="總騎乘" value={使用者.stats.totalRides} unit="次" />
          <StatsCard icon="🛣️" label="總距離" value={使用者.stats.totalDistance} unit="km" />
          <StatsCard icon="⛰️" label="總爬升" value={使用者.stats.totalElevation} unit="m" />
        </div>

        {/* 成就：縣市收集 */}
        <AchievementGrid 解鎖縣市={使用者.stats.countiesVisited} />

        {/* 特殊成就徽章 */}
        {使用者.achievements.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-700">🏆 成就徽章</h3>
            <div className="grid grid-cols-2 gap-2">
              {使用者.achievements.map(ach => (
                <div key={ach.id} className="flex items-center gap-2 rounded-lg bg-white p-3 shadow-sm">
                  <span className="text-2xl">{ach.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{ach.name}</p>
                    <p className="text-xs text-gray-500">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 騎乘紀錄時間軸 */}
        <RideTimeline 記錄={使用者.rideHistory} />

        {/* 底部登出按鈕 */}
        <Button fullWidth variant="ghost" onClick={處理登出} className="text-gray-500">
          <LogOut size={16} /> 登出
        </Button>
      </div>
    </div>
  )
}
