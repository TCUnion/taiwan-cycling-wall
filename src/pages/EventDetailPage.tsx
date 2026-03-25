// 活動詳情頁面

import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Mountain, Route, Users, Clock, ExternalLink, Share2, Zap, Link, AlertCircle, UserPlus, PartyPopper, Pencil } from 'lucide-react'
import { useEventStore } from '../stores/eventStore'
import { useAuthStore } from '../stores/authStore'
import { 查找縣市 } from '../data/counties'
import { 格式化完整日期, 格式化距離 } from '../utils/formatters'
import { 區域背景色 } from '../utils/regionMapping'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import ParticipantMap from '../components/event/ParticipantMap'
import MoakBadge from '../components/event/MoakBadge'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { 使用者, 所有使用者 } = useAuthStore()
  const { 活動列表, 參加活動, 退出活動 } = useEventStore()

  const 活動 = 活動列表.find(e => e.id === id)
  if (!活動) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-cork">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">找不到這個活動</p>
          <Button variant="ghost" onClick={() => navigate('/wall')} className="mt-4">回到公布欄</Button>
        </div>
      </div>
    )
  }

  const 縣市 = 查找縣市(活動.countyId)
  const 已參加 = 使用者 ? 活動.participants.includes(使用者.id) : false
  const 已額滿 = 活動.participants.length >= 活動.maxParticipants
  // 粉絲頁發起的活動：creatorId 為 page-{pageId}，發起人是管理該頁的使用者
  const 是粉絲頁活動 = 活動.creatorId.startsWith('page-')
  const 粉絲頁Id = 是粉絲頁活動 ? 活動.creatorId.replace('page-', '') : ''
  const 是發起人 = 使用者 ? (
    活動.creatorId === 使用者.id ||
    (是粉絲頁活動 && 使用者.managedPages?.some(p => p.pageId === 粉絲頁Id))
  ) : false
  const 是模擬活動 = 活動.id.startsWith('evt-')
  // 粉絲頁活動：顯示粉絲頁名稱/頭像；個人活動：從所有使用者查找
  const 粉絲頁資訊 = 是粉絲頁活動 ? 所有使用者.flatMap(u => u.managedPages ?? []).find(p => p.pageId === 粉絲頁Id) : undefined
  const 發起人 = 是粉絲頁活動
    ? (粉絲頁資訊 ? { id: 活動.creatorId, name: 粉絲頁資訊.name, avatar: 粉絲頁資訊.pictureUrl } as { id: string; name: string; avatar: string } : undefined)
    : 所有使用者.find(u => u.id === 活動.creatorId)

  const 導航連結 = 活動.meetingPoint
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(活動.meetingPoint)}`
    : ''

  const 處理參加 = () => {
    if (!使用者) return
    if (已參加) { 退出活動(活動.id, 使用者.id) }
    else { 參加活動(活動.id, 使用者.id) }
  }

  // 判斷路線連結類型
  const 路線連結類型 = (url: string) => {
    if (url.includes('strava.com')) return 'Strava'
    if (url.includes('garmin.com')) return 'Garmin Connect'
    if (url.includes('ridewithgps.com')) return 'Ride with GPS'
    return '路線連結'
  }

  return (
    <div className="min-h-svh bg-cork pb-8">
      <div className={`${區域背景色[活動.region]} h-2`} />

      {/* 導覽列 */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate('/wall')} aria-label="返回" className="p-2 -ml-1 rounded-full cursor-pointer hover:bg-black/5 transition-colors">
          <ArrowLeft size={22} />
        </button>
        <button onClick={() => navigate(`/event/${活動.id}/share`)} aria-label="分享" className="p-2 rounded-full cursor-pointer hover:bg-black/5 transition-colors">
          <Share2 size={20} />
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* 標題 + 發起人 */}
        <div>
          <Badge variant="region" region={活動.region} className="mb-2">{活動.region} · {縣市?.name}</Badge>
          <h1 className="text-2xl font-bold">{活動.title}</h1>
          {發起人 && (
            <div className="flex items-center gap-2 mt-2">
              <Avatar emoji={發起人.avatar} size="sm" />
              <span className="text-sm text-gray-600">{發起人.name} 發起</span>
            </div>
          )}
        </div>

        {/* 時間 + 人數 */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard icon={<Calendar size={18} />} label="約騎日期" value={格式化完整日期(活動.date)} />
          <InfoCard icon={<Clock size={18} />} label="集合時間" value={活動.time} />
        </div>

        {/* 距離 / 爬升 / 配速（有值才顯示） */}
        {(活動.distance > 0 || 活動.elevation > 0 || 活動.pace !== '自由配速') && (
          <div className="grid grid-cols-3 gap-3">
            {活動.distance > 0 && <InfoCard icon={<Route size={18} />} label="距離" value={格式化距離(活動.distance)} />}
            {活動.elevation > 0 && <InfoCard icon={<Mountain size={18} />} label="爬升" value={`${活動.elevation} m`} />}
            {活動.pace !== '自由配速' && <InfoCard icon={<Zap size={18} />} label="配速" value={活動.pace} />}
          </div>
        )}

        {/* 集合地點 */}
        {活動.meetingPoint && (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-start gap-2.5">
              <MapPin size={18} className="text-strava shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">集合地點</p>
                <p className="text-gray-700 text-sm mt-0.5">{活動.meetingPoint}</p>
                <a href={活動.meetingPointUrl || 導航連結} target="_blank" rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs text-strava cursor-pointer hover:underline">
                  <ExternalLink size={12} /> 在 Google Maps 開啟
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 路線連結（Strava / Garmin / 其他） */}
        {活動.stravaRouteUrl && (
          <a href={活動.stravaRouteUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-strava/10 px-4 py-3 text-sm text-strava cursor-pointer hover:bg-strava/20 transition-colors">
            <Link size={18} />
            <span className="font-medium">{路線連結類型(活動.stravaRouteUrl)}：查看路線</span>
            <ExternalLink size={14} className="ml-auto" />
          </a>
        )}

        {/* 活動說明（路線描述 + 注意事項，支援簡易 Markdown） */}
        {活動.description && (
          <div className="rounded-xl bg-white p-4 shadow-sm text-sm text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_li]:my-0.5"
               dangerouslySetInnerHTML={{ __html: (() => {
                 // 先跳脫 HTML
                 let html = 活動.description
                   .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                 // 粗體
                 html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                 // 列表：連續以 - 開頭的行轉為 <ul><li>
                 html = html.replace(/(^|\n)(- .+(?:\n- .+)*)/g, (_match, prefix, block) => {
                   const items = block.split('\n').map((line: string) => `<li>${line.slice(2)}</li>`).join('')
                   return `${prefix}<ul>${items}</ul>`
                 })
                 // 剩餘換行轉 <br>
                 html = html.replace(/\n/g, '<br>')
                 return html
               })() }} />
        )}

        {/* MOAK 認證 */}
        {活動.moakEventId && <MoakBadge moakEventId={活動.moakEventId} />}

        {/* 參加者分布 */}
        <ParticipantMap participantIds={活動.participants} />

        {/* 參加者列表 */}
        <div className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Users size={14} /> 參加者 ({活動.participants.length}/{活動.maxParticipants})
          </h3>
          <div className="flex flex-wrap gap-2">
            {活動.participants.map(uid => {
              const u = 所有使用者.find(u => u.id === uid)
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
        <div className="pt-2 space-y-2">
          {是發起人 && (
            <Button fullWidth variant="outline" onClick={() => navigate(`/event/${活動.id}/edit`)}>
              <Pencil size={16} /> 編輯活動
            </Button>
          )}
          {是模擬活動 ? (
            <Button fullWidth variant="secondary" disabled>此為模擬活動，無法參加</Button>
          ) : 是發起人 ? (
            <Button fullWidth variant="secondary" disabled><PartyPopper size={16} /> 你是這場活動的發起人</Button>
          ) : (
            <Button
              fullWidth
              variant={已參加 ? 'outline' : 'primary'}
              disabled={!已參加 && 已額滿}
              onClick={處理參加}
            >
              {已參加 ? '退出活動' : 已額滿 ? '已額滿' : <><UserPlus size={16} /> 我要參加！</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

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
