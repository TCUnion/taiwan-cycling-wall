import { useState, useRef, useCallback, useEffect } from 'react'
import { Trash2, Navigation, Check, AlertCircle } from 'lucide-react'
import type { SavedRoute } from '../../types'
import { 規劃騎車路線 } from '../../utils/osrmService'
import { 格式化距離 } from '../../utils/formatters'
import { useAuthStore } from '../../stores/authStore'
import { useRouteStore } from '../../stores/routeStore'
import { 產生ID } from '../../utils/formatters'
import Button from '../ui/Button'
import RouteMap from './RouteMap'
import CountyPicker from '../event/CountyPicker'

interface Props {
  onSaved?: (route: SavedRoute) => void
}

export default function RoutePlanner({ onSaved }: Props) {
  const 使用者 = useAuthStore(s => s.使用者)
  const 新增路線 = useRouteStore(s => s.新增路線)

  const [waypoints, setWaypoints] = useState<[number, number][]>([])
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
  const [distance, setDistance] = useState(0)
  const [duration, setDuration] = useState(0)
  const [planning, setPlanning] = useState(false)
  const [name, setName] = useState('')
  const [countyId, setCountyId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const 新增航點 = useCallback((lat: number, lng: number) => {
    setWaypoints(prev => [...prev, [lat, lng]])
    setSaved(false)
  }, [])

  const 刪除航點 = useCallback((i: number) => {
    setWaypoints(prev => prev.filter((_, idx) => idx !== i))
    setSaved(false)
  }, [])

  const 清除全部 = useCallback(() => {
    setWaypoints([])
    setRouteCoords([])
    setDistance(0)
    setDuration(0)
    setSaved(false)
    setShowSaveForm(false)
  }, [])

  // 航點變化時 debounce 呼叫 OSRM
  useEffect(() => {
    if (waypoints.length < 2) {
      setRouteCoords([])
      setDistance(0)
      setDuration(0)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setPlanning(true)
      const result = await 規劃騎車路線(waypoints)
      if (result) {
        setRouteCoords(result.coordinates)
        setDistance(result.distance)
        setDuration(result.duration)
      }
      setPlanning(false)
    }, 300)
  }, [waypoints])

  const 儲存路線 = async () => {
    if (!使用者 || !name.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    const route: SavedRoute = {
      id: 產生ID(),
      name: name.trim(),
      distance,
      elevation: 0,
      countyId,
      coordinates: routeCoords,
      waypoints,
      source: 'planned',
      creatorId: 使用者.id,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    }
    const ok = await 新增路線(route)
    setSaving(false)
    if (ok) {
      setSaved(true)
      onSaved?.(route)
    } else {
      setSaveError(true)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">點擊地圖新增航點，系統自動沿道路規劃路線</p>

      <RouteMap
        coordinates={routeCoords}
        waypoints={waypoints}
        interactive
        onMapClick={新增航點}
        className="h-[60vh]"
      />

      {/* 路線資訊 */}
      {waypoints.length >= 2 && (
        <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm">
          {planning
            ? <span className="text-gray-500">規劃中…</span>
            : <>
              <span className="flex items-center gap-1.5 text-gray-700">
                <Navigation size={14} className="text-strava" />
                {格式化距離(distance)}
              </span>
              <span className="text-gray-500">預估 {duration} 分鐘</span>
            </>
          }
        </div>
      )}

      {/* 航點列表 */}
      {waypoints.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1">
          <p className="text-xs font-medium text-gray-500 mb-2">航點清單</p>
          {waypoints.map(([lat, lng], i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1">
              <span className="text-gray-700">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-strava text-white text-xs font-bold mr-2">{i + 1}</span>
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
              <button
                type="button"
                onClick={() => 刪除航點(i)}
                aria-label={`刪除航點 ${i + 1}`}
                className="p-1 text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <Button variant="ghost" fullWidth onClick={清除全部} className="!text-gray-500 !text-xs mt-1">
            清除全部航點
          </Button>
        </div>
      )}

      {/* 儲存按鈕 */}
      {routeCoords.length >= 2 && !showSaveForm && !saved && (
        <Button fullWidth onClick={() => setShowSaveForm(true)}>
          儲存到路線庫
        </Button>
      )}

      {showSaveForm && !saved && (
        <div className="space-y-3 bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700">路線名稱</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="輸入路線名稱…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-strava/40"
            autoFocus
          />
          <CountyPicker value={countyId} onChange={setCountyId} />
          <Button
            fullWidth
            onClick={儲存路線}
            disabled={saving || !name.trim()}
          >
            {saving ? '儲存中…' : '確認儲存'}
          </Button>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-xl px-4 py-3">
          <Check size={16} />
          路線已儲存到路線庫
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
          <AlertCircle size={16} />
          儲存失敗，請確認網路連線並重試
        </div>
      )}
    </div>
  )
}
