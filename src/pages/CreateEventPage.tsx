import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useEventStore, 取得便利貼顏色 } from '../stores/eventStore'
import { 查找縣市 } from '../data/counties'
import { 產生ID } from '../utils/formatters'
import type { CyclingEvent, RouteTemplate } from '../types'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import CountyPicker from '../components/event/CountyPicker'
import RouteTemplatePicker from '../components/event/RouteTemplatePicker'

export default function CreateEventPage() {
  const navigate = useNavigate()
  const 使用者 = useAuthStore(s => s.使用者)
  const 新增活動 = useEventStore(s => s.新增活動)

  // 表單狀態
  const [步驟, set步驟] = useState(1)
  const [countyId, setCountyId] = useState(使用者?.countyId || 'taipei')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('06:00')
  const [meetingPoint, setMeetingPoint] = useState('')
  const [distance, setDistance] = useState(0)
  const [elevation, setElevation] = useState(0)
  const [pace, setPace] = useState('20-25 km/h')
  const [maxParticipants, setMaxParticipants] = useState(15)
  const [stravaRouteUrl, setStravaRouteUrl] = useState('')
  const [選中路線Id, set選中路線Id] = useState<string>()

  // 經典路線快填
  const 套用路線 = (route: RouteTemplate) => {
    set選中路線Id(route.id)
    setCountyId(route.defaultCountyId)
    setTitle(route.name)
    setDescription(route.description)
    setDistance(route.distance)
    setElevation(route.elevation)
  }

  // Google Maps 連結
  const 地圖連結 = meetingPoint
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingPoint)}`
    : ''

  // 提交
  const 提交 = () => {
    if (!使用者 || !title || !date || !countyId) return
    const 縣市 = 查找縣市(countyId)
    const id = 產生ID()

    const 新活動: CyclingEvent = {
      id,
      title,
      description,
      countyId,
      region: 縣市?.region || '北部',
      date,
      time,
      meetingPoint,
      distance,
      elevation,
      pace,
      participants: [使用者.id],
      maxParticipants,
      stravaRouteUrl: stravaRouteUrl || undefined,
      stickyColor: 取得便利貼顏色(id),
      tags: [],
      creatorId: 使用者.id,
      createdAt: new Date().toISOString(),
    }

    新增活動(新活動)
    navigate('/wall', { replace: true })
  }

  return (
    <div className="min-h-svh bg-cork">
      {/* 頂部導覽 */}
      <div className="sticky top-0 z-30 flex items-center gap-3 bg-cork/95 backdrop-blur-sm px-4 py-3">
        <button onClick={() => 步驟 > 1 ? set步驟(步驟 - 1) : navigate(-1)} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">發起約騎</h1>
        <span className="ml-auto text-sm text-gray-500">步驟 {步驟}/3</span>
      </div>

      {/* 步驟指示器 */}
      <div className="flex gap-1 px-4 mb-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= 步驟 ? 'bg-strava' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      <div className="px-4 pb-8">
        {/* 步驟一：選擇地點 */}
        {步驟 === 1 && (
          <div className="space-y-6">
            <RouteTemplatePicker onSelect={套用路線} 選中的Id={選中路線Id} />
            <div className="border-t pt-4">
              <CountyPicker value={countyId} onChange={setCountyId} />
            </div>
            <Button fullWidth onClick={() => set步驟(2)}>
              下一步 →
            </Button>
          </div>
        )}

        {/* 步驟二：活動詳情 */}
        {步驟 === 2 && (
          <div className="space-y-4">
            <Input label="活動名稱" value={title} onChange={e => setTitle(e.target.value)} placeholder="例：河濱晨騎團" />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">活動說明</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="描述路線、難度、注意事項..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20 placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="日期" type="date" value={date} onChange={e => setDate(e.target.value)} />
              <Input label="時間" type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
            <div>
              <Input label="集合地點" value={meetingPoint} onChange={e => setMeetingPoint(e.target.value)} placeholder="例：大佳河濱公園停車場" />
              {meetingPoint && (
                <a href={地圖連結} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-strava hover:underline">
                  <ExternalLink size={12} /> 在 Google Maps 開啟
                </a>
              )}
            </div>
            <Button fullWidth onClick={() => set步驟(3)} disabled={!title || !date}>
              下一步 →
            </Button>
          </div>
        )}

        {/* 步驟三：騎乘資訊 */}
        {步驟 === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="距離 (km)" type="number" value={distance || ''} onChange={e => setDistance(Number(e.target.value))} />
              <Input label="爬升 (m)" type="number" value={elevation || ''} onChange={e => setElevation(Number(e.target.value))} />
            </div>
            <Input label="配速" value={pace} onChange={e => setPace(e.target.value)} placeholder="例：20-25 km/h" />
            <Input label="人數上限" type="number" value={maxParticipants} onChange={e => setMaxParticipants(Number(e.target.value))} />
            <Input label="Strava 路線連結（選填）" value={stravaRouteUrl} onChange={e => setStravaRouteUrl(e.target.value)} placeholder="https://www.strava.com/routes/..." />
            <Button fullWidth onClick={提交} disabled={!title || !date}>
              🚴 發布約騎！
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
