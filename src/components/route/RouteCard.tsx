import { Trash2, Route, Mountain, FileText, Map } from 'lucide-react'
import type { SavedRoute } from '../../types'
import { 格式化距離 } from '../../utils/formatters'
import RouteMap from './RouteMap'

interface Props {
  route: SavedRoute
  selectable?: boolean
  onSelect?: (route: SavedRoute) => void
  onDelete?: (id: string) => void
}

const 來源標籤: Record<SavedRoute['source'], { label: string; className: string }> = {
  gpx: { label: 'GPX 軌跡', className: 'bg-blue-100 text-blue-700' },
  planned: { label: '規劃路線', className: 'bg-orange-100 text-orange-700' },
  manual: { label: '手動輸入', className: 'bg-gray-100 text-gray-600' },
}

export default function RouteCard({ route, selectable, onSelect, onDelete }: Props) {
  const 標籤 = 來源標籤[route.source]

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 迷你地圖預覽 */}
      {route.coordinates.length >= 2 && (
        <RouteMap
          coordinates={route.coordinates}
          waypoints={route.source === 'planned' ? route.waypoints : []}
          className="h-32"
        />
      )}
      {route.coordinates.length < 2 && (
        <div className="h-20 bg-gray-50 flex items-center justify-center text-gray-300">
          <Map size={24} />
        </div>
      )}

      {/* 路線資訊 */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug">{route.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${標籤.className}`}>{標籤.label}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          {route.distance > 0 && (
            <span className="flex items-center gap-1">
              <Route size={12} className="text-strava" />
              {格式化距離(route.distance)}
            </span>
          )}
          {route.elevation > 0 && (
            <span className="flex items-center gap-1">
              <Mountain size={12} className="text-strava" />
              {route.elevation}m
            </span>
          )}
          {route.gpxFileName && (
            <span className="flex items-center gap-1 truncate">
              <FileText size={12} />
              {route.gpxFileName}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {selectable && onSelect && (
            <button
              type="button"
              onClick={() => onSelect(route)}
              className="flex-1 rounded-lg bg-strava text-white text-xs font-medium py-1.5 cursor-pointer hover:bg-strava/90 transition-colors"
            >
              套用此路線
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(route.id)}
              aria-label="刪除路線"
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-gray-400 hover:text-red-500 hover:border-red-200 cursor-pointer transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
