import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, MessageCircle, Calendar, MapPin, Route, Mountain, Clock, Users, Zap, Loader2 } from 'lucide-react'
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

  // 分享文字
  const 分享文字 = [
    `${活動.title}`,
    `${格式化完整日期(活動.date)} ${活動.time}`,
    `${縣市?.name} ${活動.meetingPoint}`,
    活動.distance > 0 ? `${格式化距離(活動.distance)}` : '',
    '',
    活動連結,
  ].filter(Boolean).join('\n')

  // Web Share API
  const 分享 = async () => {
    const shareData: ShareData = {
      title: `${活動.title} — 約騎公布欄`,
      text: 分享文字,
      url: 活動連結,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // 使用者取消分享
      }
    } else {
      await navigator.clipboard.writeText(分享文字)
      alert('已複製到剪貼簿！')
    }
  }

  // LINE 分享
  const LINE連結 = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(活動連結)}&text=${encodeURIComponent(`${活動.title} — 一起來騎車！`)}`

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
                <div className="text-xs text-gray-400 mb-0.5">siokiu 約騎公布欄</div>
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
            {活動.maxParticipants > 0 && (
              <div className="flex items-center gap-2.5">
                <Users size={15} className="text-strava shrink-0" />
                <span>上限 {活動.maxParticipants} 人</span>
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
          <Button fullWidth variant="outline" onClick={分享}>
            <Share2 size={18} /> 分享連結
          </Button>
          <a href={LINE連結} target="_blank" rel="noopener noreferrer">
            <Button fullWidth variant="line" className="mt-3">
              <MessageCircle size={18} /> 分享到 LINE
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}
