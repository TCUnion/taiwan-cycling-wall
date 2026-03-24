import { 經典路線 } from '../../data/classicRoutes'
import type { RouteTemplate } from '../../types'
import { Route } from 'lucide-react'

interface Props {
  onSelect: (route: RouteTemplate) => void
  選中的Id?: string
}

// 難度顏色
const 難度色: Record<string, string> = {
  '休閒': 'bg-green-100 text-green-700',
  '中等': 'bg-yellow-100 text-yellow-700',
  '挑戰': 'bg-orange-100 text-orange-700',
  '極限': 'bg-red-100 text-red-700',
}

export default function RouteTemplatePicker({ onSelect, 選中的Id }: Props) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        🛣️ 經典路線快填
      </label>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {經典路線.map(route => (
          <button
            key={route.id}
            type="button"
            onClick={() => onSelect(route)}
            className={`shrink-0 flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-all ${
              選中的Id === route.id
                ? 'border-strava bg-strava/5'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Route size={14} />
              <span className="text-sm font-medium">{route.name}</span>
            </div>
            <div className="flex gap-2 text-xs text-gray-500">
              <span>{route.distance}km</span>
              <span>↑{route.elevation}m</span>
            </div>
            <span className={`text-xs rounded-full px-2 py-0.5 ${難度色[route.difficulty]}`}>
              {route.difficulty}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
