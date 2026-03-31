import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Calendar, MapPin, Route, Mountain, Clock, Zap, Loader2, Copy, Check } from 'lucide-react'
import { useEventStore } from '../stores/eventStore'
import { useAuthStore } from '../stores/authStore'
import { 查找縣市 } from '../data/counties'
import { 格式化完整日期, 格式化距離 } from '../utils/formatters'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

export default function SharePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const 活動列表 = useEventStore(s => s.活動列表)
  const 載入單一活動 = useEventStore(s => s.載入單一活動)
  const 所有使用者 = useAuthStore(s => s.所有使用者)
  const 活動 = 活動列表.find(e => e.id === id)

  const [載入中, set載入中] = useState(false)
  const [載入失敗, set載入失敗] = useState(false)
  const [已複製, set已複製] = useState(false)

  useEffect(() => {
    if (!id || 活動) return
    let cancelled = false
    set載入中(true)
    set載入失敗(false)
    載入單一活動(id).then((result) => {
      if (cancelled) return
      if (!result) set載入失敗(true)
      set載入中(false)
    })
    return () => { cancelled = true }
  }, [id, 活動, 載入單一活動])

  if (載入中) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-cork">
        <Loader2 size={32} className="animate-spin text-strava" />
      </div>
    )
  }

  if (!活動) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-cork">
        <p>{載入失敗 ? '找不到活動' : '載入中…'}</p>
      </div>
    )
  }

  const 縣市 = 查找縣市(活動.countyId)
  const 發起人 = 所有使用者.find(u => u.id === 活動.creatorId)
  const 活動連結 = `${window.location.origin}/event/${活動.id}`

  // 完整分享文字（含路線資訊 + 注意事項）
  const 完整文字 = [
    活動.title,
    `【集合時間】 ${格式化完整日期(活動.date)} ${活動.time}`,
    `【集合地點】 ${活動.meetingPoint}${活動.meetingPointUrl ? `\n${活動.meetingPointUrl}` : ''}`,
    '',
    // 路線與騎乘資訊
    活動.distance > 0 || 活動.elevation > 0 || (活動.pace && 活動.pace !== '自由配速') ? '【路線與騎乘資訊】' : '',
    活動.distance > 0 ? `距離：${格式化距離(活動.distance)}` : '',
    活動.elevation > 0 ? `爬升：${活動.elevation}m` : '',
    活動.pace && 活動.pace !== '自由配速' ? `配速：${活動.pace}` : '',
    活動.stravaRouteUrl ? `路線連結： ${活動.stravaRouteUrl}` : '',
    '',
    // 從 description 解析路線描述和注意事項
    ...(活動.description ? (() => {
      const lines: string[] = []
      const 路線match = 活動.description.match(/🛣️ 路線：\n([\s\S]*?)(?=\n\n⚠️|$)/)
      if (路線match) lines.push('【路線描述】', 路線match[1].trim(), '')
      const 備註match = 活動.description.match(/⚠️ 注意事項：\n([\s\S]*)$/)
      if (備註match) {
        lines.push('【注意事項】')
        lines.push(備註match[1].replace(/^• /gm, '· ').trim(), '')
      }
      return lines
    })() : []),
    `【更多資訊請看】 ${活動連結}`,
    '',
    '【 #siokiu約騎資訊】',
  ].filter(l => l !== undefined).join('\n').replace(/\n{3,}/g, '\n\n')
  const 分享到FB = async () => {
    await navigator.clipboard.writeText(完整文字)
    const fbAppId = import.meta.env.VITE_FB_APP_ID
    const FB連結 = fbAppId
      ? `https://www.facebook.com/dialog/feed?app_id=${fbAppId}&link=${encodeURIComponent(活動連結)}&display=popup`
      : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(活動連結)}`
    window.open(FB連結, '_blank', 'noopener,noreferrer,width=600,height=600')
  }

  // LINE 分享
  const LINE連結 = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(活動連結)}&text=${encodeURIComponent(完整文字)}`

  return (
    <div className="min-h-svh bg-cork pb-8">
      {/* 導覽 */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="cursor-pointer p-1 rounded-full focus-visible:ring-2 focus-visible:ring-strava/40 focus-visible:outline-none" aria-label="返回">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">分享活動</h1>
      </div>

      <div className="px-4 space-y-6">
        {/* 預覽卡片 — 模擬分享出去的樣子 */}
        <div className="rounded-xl overflow-hidden shadow-lg bg-white">
          {/* 標題區 */}
          <div className="p-5 pb-3">
            <div className="flex items-start gap-3 mb-3">
              {發起人 && <Avatar emoji={發起人.avatar} size="md" />}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400 mb-0.5">siokiu 相揪約騎公布欄</div>
                <h2 className="text-lg font-bold text-gray-900 leading-snug">{活動.title}</h2>
              </div>
              <Badge variant="region" region={活動.region}>{活動.region}</Badge>
            </div>
          </div>

          {/* 資訊區 */}
          <div className="px-5 pb-5 space-y-2.5 text-sm text-gray-600">
            <div className="flex items-center gap-2.5">
              <Calendar size={15} className="text-strava shrink-0" />
              <span>{格式化完整日期(活動.date)}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock size={15} className="text-strava shrink-0" />
              <span>{活動.time} 集合</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin size={15} className="text-strava shrink-0" />
              <span className="truncate">{縣市?.name} · {活動.meetingPoint}</span>
            </div>
            {活動.distance > 0 && (
              <div className="flex items-center gap-2.5">
                <Route size={15} className="text-strava shrink-0" />
                <span>{格式化距離(活動.distance)}</span>
              </div>
            )}
            {活動.elevation > 0 && (
              <div className="flex items-center gap-2.5">
                <Mountain size={15} className="text-strava shrink-0" />
                <span>{活動.elevation}m 爬升</span>
              </div>
            )}
            {活動.pace && 活動.pace !== '自由配速' && (
              <div className="flex items-center gap-2.5">
                <Zap size={15} className="text-strava shrink-0" />
                <span>{活動.pace}</span>
              </div>
            )}
          </div>

          {/* 底部品牌 */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-5 w-5" />
            <span className="text-xs text-gray-400">siokiu.criterium.tw</span>
          </div>
        </div>

        {/* 分享按鈕 */}
        <div className="space-y-3">
          <Button fullWidth className="!bg-facebook !text-white hover:!bg-facebook/90" onClick={分享到FB}>
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            分享到 Facebook
          </Button>
          <p className="text-xs text-center text-gray-600 -mt-1">點擊後活動資訊已複製，請在 FB 貼文中按「貼上」</p>
          <a href={LINE連結} target="_blank" rel="noopener noreferrer">
            <Button fullWidth variant="line" className="mt-3">
              <MessageCircle size={18} /> 分享到 LINE
            </Button>
          </a>
          <Button
            fullWidth
            variant="outline"
            className="mt-3 !bg-white !text-gray-800 !border-gray-200 hover:!bg-gray-50"
            onClick={async () => {
              await navigator.clipboard.writeText(完整文字)
              set已複製(true)
              setTimeout(() => set已複製(false), 2000)
            }}
          >
            {已複製 ? <Check size={18} /> : <Copy size={18} />}
            {已複製 ? '已複製' : '複製連結'}
          </Button>
        </div>
      </div>
    </div>
  )
}
