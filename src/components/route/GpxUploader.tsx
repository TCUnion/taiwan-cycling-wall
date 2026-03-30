import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Check, AlertCircle } from 'lucide-react'
import type { GpxParseResult, SavedRoute } from '../../types'
import { 解析GPX } from '../../utils/gpxParser'
import { 格式化距離 } from '../../utils/formatters'
import { useAuthStore } from '../../stores/authStore'
import { useRouteStore } from '../../stores/routeStore'
import { 產生ID } from '../../utils/formatters'
import Button from '../ui/Button'
import CountyPicker from '../event/CountyPicker'
import RouteMap from './RouteMap'

interface Props {
  onSaved?: (route: SavedRoute) => void
}

export default function GpxUploader({ onSaved }: Props) {
  const 使用者 = useAuthStore(s => s.使用者)
  const 新增路線 = useRouteStore(s => s.新增路線)

  const [result, setResult] = useState<GpxParseResult | null>(null)
  const [name, setName] = useState('')
  const [countyId, setCountyId] = useState('')
  const [gpxFileName, setGpxFileName] = useState('')
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const 處理檔案 = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setError('請選擇 .gpx 格式的檔案')
      return
    }
    setError('')
    setSaved(false)
    setGpxFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = 解析GPX(e.target?.result as string)
        setResult(parsed)
        setName(parsed.name)
      } catch {
        setError('GPX 解析失敗，請確認檔案格式')
      }
    }
    reader.readAsText(file)
  }, [])

  const 儲存路線 = async () => {
    if (!result || !使用者) return
    setSaving(true)
    const now = new Date().toISOString()
    const route: SavedRoute = {
      id: 產生ID(),
      name: name || result.name,
      distance: result.distance,
      elevation: result.elevation,
      countyId,
      coordinates: result.coordinates,
      waypoints: [],
      source: 'gpx',
      gpxFileName,
      creatorId: 使用者.id,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    }
    await 新增路線(route)
    setSaving(false)
    setSaved(true)
    onSaved?.(route)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) 處理檔案(file)
  }

  return (
    <div className="space-y-4">
      {/* 拖放區域 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? 'border-strava bg-strava/5' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">拖放 GPX 檔案至此</p>
        <p className="text-xs text-gray-500 mt-1">或點擊選擇檔案</p>
        <input
          ref={fileRef}
          type="file"
          accept=".gpx"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && 處理檔案(e.target.files[0])}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {result && (
        <>
          {/* 解析結果 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText size={15} className="text-strava" />
              <span className="font-medium">{gpxFileName}</span>
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>距離 <strong className="text-gray-900">{格式化距離(result.distance)}</strong></span>
              <span>爬升 <strong className="text-gray-900">{result.elevation}m</strong></span>
              <span>點數 <strong className="text-gray-900">{result.pointCount.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* 地圖預覽 */}
          <RouteMap coordinates={result.coordinates} className="h-52" />

          {/* 名稱輸入 */}
          <div>
            <label className="text-sm font-medium text-gray-700">路線名稱</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="輸入路線名稱…"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-strava/40"
            />
          </div>

          {/* 縣市選擇 */}
          <CountyPicker value={countyId} onChange={setCountyId} />

          {/* 儲存按鈕 */}
          <Button
            fullWidth
            onClick={儲存路線}
            disabled={saving || saved || !name.trim()}
          >
            {saved ? <><Check size={16} /> 已儲存到路線庫</> : saving ? '儲存中…' : '儲存到路線庫'}
          </Button>
        </>
      )}
    </div>
  )
}
