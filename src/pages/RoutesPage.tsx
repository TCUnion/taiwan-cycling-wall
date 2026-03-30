import { useState, useEffect } from 'react'
import { Map, Upload, Navigation, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useRouteStore } from '../stores/routeStore'
import GpxUploader from '../components/route/GpxUploader'
import RoutePlanner from '../components/route/RoutePlanner'
import RouteCard from '../components/route/RouteCard'

type 分頁 = '我的路線' | '規劃路線' | '上傳軌跡'

const 分頁項目: { key: 分頁; icon: typeof Map; label: string }[] = [
  { key: '我的路線', icon: Map, label: '我的路線' },
  { key: '規劃路線', icon: Navigation, label: '規劃路線' },
  { key: '上傳軌跡', icon: Upload, label: '上傳軌跡' },
]

export default function RoutesPage() {
  const [目前分頁, set目前分頁] = useState<分頁>('我的路線')
  const 使用者 = useAuthStore(s => s.使用者)
  const { 路線列表, 載入中, 載入路線, 刪除路線 } = useRouteStore()

  useEffect(() => {
    if (使用者) 載入路線(使用者.id)
  }, [使用者, 載入路線])

  return (
    <div className="min-h-svh bg-cork pb-8">
      {/* 頁首 */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gray-900">路線庫</h1>
        <p className="text-sm text-gray-500 mt-0.5">管理、規劃、上傳你的騎乘路線</p>
      </div>

      {/* 分頁切換 */}
      <div className="flex border-b border-gray-200 bg-white px-4">
        {分頁項目.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => set目前分頁(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 cursor-pointer transition-colors -mb-px ${
              目前分頁 === key
                ? 'border-strava text-strava'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">
        {/* 我的路線 */}
        {目前分頁 === '我的路線' && (
          <>
            {載入中 ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-strava" />
              </div>
            ) : 路線列表.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Map size={40} className="mx-auto mb-3" />
                <p className="text-sm font-medium">尚無儲存的路線</p>
                <p className="text-xs mt-1">使用「規劃路線」或「上傳軌跡」新增</p>
              </div>
            ) : (
              <div className="space-y-3">
                {路線列表.map(route => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    onDelete={刪除路線}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 規劃路線 */}
        {目前分頁 === '規劃路線' && (
          <RoutePlanner onSaved={() => {
            if (使用者) 載入路線(使用者.id)
            set目前分頁('我的路線')
          }} />
        )}

        {/* 上傳軌跡 */}
        {目前分頁 === '上傳軌跡' && (
          <GpxUploader onSaved={() => {
            if (使用者) 載入路線(使用者.id)
            set目前分頁('我的路線')
          }} />
        )}
      </div>
    </div>
  )
}
