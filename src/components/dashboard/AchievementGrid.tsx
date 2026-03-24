// 縣市收集成就格 — 以 4 欄格狀顯示 22 縣市的解鎖狀態

import { 縣市列表 } from '../../data/counties'
import { 區域背景色 } from '../../utils/regionMapping'

interface Props {
  解鎖縣市: string[]  // 已解鎖的縣市 ID 陣列
}

export default function AchievementGrid({ 解鎖縣市 }: Props) {
  const 解鎖數 = 解鎖縣市.length
  const 總數 = 縣市列表.length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">🏅 縣市收集 ({解鎖數}/{總數})</h3>
        <span className="text-xs text-gray-500">
          {Math.round((解鎖數 / 總數) * 100)}% 完成
        </span>
      </div>

      {/* 進度條 */}
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-strava transition-all duration-500"
          style={{ width: `${(解鎖數 / 總數) * 100}%` }}
        />
      </div>

      {/* 縣市印章格 */}
      <div className="grid grid-cols-4 gap-2">
        {縣市列表.map(county => {
          const 已解鎖 = 解鎖縣市.includes(county.id)
          return (
            <div
              key={county.id}
              className={`
                flex flex-col items-center justify-center rounded-lg p-2 text-center
                transition-all duration-300
                ${已解鎖
                  ? `${區域背景色[county.region]} text-white shadow-md`
                  : 'bg-gray-100 text-gray-400'
                }
              `}
            >
              <span className="text-lg">{已解鎖 ? '✅' : '🔒'}</span>
              <span className="text-[10px] font-medium mt-0.5 leading-tight">{county.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
