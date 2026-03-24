import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Mountain, Route, Users, Clock, ExternalLink, Share2, Zap } from 'lucide-react'
import { useEventStore } from '../stores/eventStore'
import { useAuthStore } from '../stores/authStore'
import { 查找縣市 } from '../data/counties'
import { 格式化完整日期, 格式化距離 } from '../utils/formatters'
import { 區域背景色 } from '../utils/regionMapping'
import { 模擬使用者 } from '../data/mockUsers'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import ParticipantMap from '../components/event/ParticipantMap'
import MoakBadge from '../components/event/MoakBadge'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const 使用者 = useAuthStore(s => s.使用者)
  const { 活動列表, 參加活動, 退出活動 } = useEventStore()

  const 活動 = 活動列表.find(e => e.id === id)
  if (!活動) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-cork">
        <div className="text-center">
          <p className="text-5xl mb-4">🤷</p>
          <p className="text-lg font-medium">找不到這個活動</p>
          <Button variant="ghost" onClick={() => navigate('/wall')} className="mt-4">回到約騎牆</Button>
        </div>
      </div>
    )
  }

  const 縣市 = 查找縣市(活動.countyId)
  const 已參加 = 使用者 ? 活動.participants.includes(使用者.id) : false
  const 已額滿 = 活動.participants.length >= 活動.maxParticipants
  const 是發起人 = 使用者?.id === 活動.creatorId

  // Google Maps 導航連結
  const 導航連結 = 活動.meetingPoint
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(活動.meetingPoint)}`
    : ''

  const 處理參加 = () => {
    if (!使用者) return
    if (已參加) {
      退出活動(活動.id, 使用者.id)
    } else {
      參加活動(活動.id, 使用者.id)
    }
  }

  return (
    <div className="min-h-svh bg-cork pb-8">
      {/* 頂部色帶 */}
      <div className={`${區域背景色[活動.region]} h-2`} />

      {/* 導覽列 */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <button onClick={() => navigate(`/event/${活動.id}/share`)} className="p-2 rounded-full hover:bg-white/50">
          <Share2 size={20} />
        </button>
      </div>

      <div className="px-4 space-y-5">
        {/* 標題區 */}
        <div>
          <Badge variant="region" region={活動.region} className="mb-2">{活動.region} · {縣市?.name}</Badge>
          <h1 className="text-2xl font-bold">{活動.title}</h1>
          {活動.description && (
            <p className="mt-2 text-gray-600 text-sm leading-relaxed">{活動.description}</p>
          )}
        </div>

        {/* 資訊格 */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard icon={<Calendar size={18} />} label="日期" value={格式化完整日期(活動.date)} />
          <InfoCard icon={<Clock size={18} />} label="時間" value={活動.time} />
          <InfoCard icon={<Route size={18} />} label="距離" value={格式化距離(活動.distance)} />
          <InfoCard icon={<Mountain size={18} />} label="爬升" value={`${活動.elevation} m`} />
          <InfoCard icon={<Zap size={18} />} label="配速" value={活動.pace} />
          <InfoCard icon={<Users size={18} />} label="參加" value={`${活動.participants.length} / ${活動.maxParticipants}`} />
        </div>

        {/* 集合地點 */}
        {活動.meetingPoint && (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-start gap-2">
              <MapPin size={18} className="text-strava shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">集合地點</p>
                <p className="text-gray-600 text-sm">{活動.meetingPoint}</p>
                <a href={導航連結} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-strava hover:underline">
                  <ExternalLink size={12} /> 在 Google Maps 開啟
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Strava 連結 */}
        {活動.stravaRouteUrl && (
          <a href={活動.stravaRouteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-strava/10 px-4 py-3 text-sm text-strava hover:bg-strava/20 transition-colors">
            <span className="text-lg">🔥</span>
            <span className="font-medium">在 Strava 查看路線</span>
            <ExternalLink size={14} className="ml-auto" />
          </a>
        )}

        {/* MOAK 認證 */}
        {活動.moakEventId && <MoakBadge moakEventId={活動.moakEventId} />}

        {/* 參加者分布 */}
        <ParticipantMap participantIds={活動.participants} />

        {/* 參加者列表 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">👥 參加者 ({活動.participants.length})</h3>
          <div className="flex flex-wrap gap-2">
            {活動.participants.map(uid => {
              const u = 模擬使用者.find(u => u.id === uid)
              if (!u) return null
              return (
                <div key={uid} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
                  <Avatar emoji={u.avatar} size="sm" />
                  <span className="text-sm">{u.name}</span>
                  {uid === 活動.creatorId && <span className="text-xs text-strava">發起人</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="pt-2">
          {是發起人 ? (
            <Button fullWidth variant="secondary" disabled>你是這場活動的發起人 🎉</Button>
          ) : (
            <Button
              fullWidth
              variant={已參加 ? 'outline' : 'primary'}
              disabled={!已參加 && 已額滿}
              onClick={處理參加}
            >
              {已參加 ? '退出活動' : 已額滿 ? '已額滿' : '🙋 我要參加！'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// 資訊卡片子元件
function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-white p-3 shadow-sm">
      <div className="text-strava mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
