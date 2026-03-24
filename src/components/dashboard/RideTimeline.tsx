// 騎乘紀錄時間軸 — 以垂直時間軸呈現歷次騎乘記錄

import type { RideRecord } from '../../types'
import { 查找縣市 } from '../../data/counties'
import { 格式化日期 } from '../../utils/formatters'

interface Props {
  記錄: RideRecord[]
}

export default function RideTimeline({ 記錄 }: Props) {
  // 尚無記錄時顯示空狀態
  if (記錄.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-3xl mb-2">🏁</p>
        <p className="text-sm">還沒有騎乘記錄</p>
        <p className="text-xs mt-1">參加活動後就會出現在這裡</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-700">📅 騎乘紀錄</h3>
      <div className="relative pl-6">
        {/* 時間軸線 */}
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />

        {記錄.map((rec, idx) => {
          const 縣市 = 查找縣市(rec.countyId)
          return (
            <div key={`${rec.eventId}-${idx}`} className="relative pb-4 last:pb-0">
              {/* 節點圓點 */}
              <div className="absolute -left-4 top-1.5 w-3 h-3 rounded-full bg-strava border-2 border-white" />
              <div className="rounded-lg bg-white p-3 shadow-sm ml-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{格式化日期(rec.date)}</span>
                  <span className="text-xs font-medium text-gray-700">{縣市?.name}</span>
                </div>
                <div className="flex gap-3 mt-1 text-sm text-gray-700">
                  <span>🛣️ {rec.distance} km</span>
                  <span>⛰️ {rec.elevation} m</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
