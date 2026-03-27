import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, MessageCircle } from 'lucide-react'
import { useEventStore } from '../stores/eventStore'
import { 查找縣市 } from '../data/counties'
import { 格式化完整日期 } from '../utils/formatters'
import Button from '../components/ui/Button'

export default function SharePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const 活動列表 = useEventStore(s => s.活動列表)
  const 活動 = 活動列表.find(e => e.id === id)

  if (!活動) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-cork">
        <p>找不到活動</p>
      </div>
    )
  }

  const 縣市 = 查找縣市(活動.countyId)

  // Web Share API
  const 分享 = async () => {
    const shareData: ShareData = {
      title: `🚴 ${活動.title} — 約騎公布欄`,
      text: `一起來騎車！${活動.title}\n📅 ${活動.date} ${活動.time}\n📍 ${活動.meetingPoint}`,
      url: window.location.origin + `/event/${活動.id}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // 使用者取消分享
      }
    } else {
      // fallback: 複製連結
      await navigator.clipboard.writeText(shareData.url || '')
      alert('連結已複製到剪貼簿！')
    }
  }

  // LINE 分享連結
  const LINE連結 = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
    window.location.origin + `/event/${活動.id}`
  )}&text=${encodeURIComponent(`🚴 ${活動.title} — 一起來騎車！`)}`

  return (
    <div className="min-h-svh bg-cork pb-8">
      {/* 導覽 */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="cursor-pointer p-1" aria-label="返回">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">分享活動</h1>
      </div>

      <div className="px-4 space-y-6">
        {/* 預覽卡片 */}
        <div className="rounded-xl overflow-hidden shadow-lg bg-white p-6">
          <div className="flex items-center gap-4 mb-4">
            <img src="/favicon.svg" alt="siokiu" className="h-12 w-12" />
            <div>
              <div className="text-xs text-gray-400">siokiu 約騎公布欄</div>
              <div className="text-xl font-bold text-gray-900">{活動.title}</div>
            </div>
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <div>📅 {格式化完整日期(活動.date)} {活動.time}</div>
            <div>📍 {縣市?.name} · {活動.meetingPoint}</div>
            {(活動.distance || 活動.elevation) && (
              <div>
                {活動.distance ? `🛣️ ${活動.distance}km` : ''}
                {活動.elevation ? ` / ⛰️ ${活動.elevation}m` : ''}
              </div>
            )}
          </div>
        </div>

        {/* 分享按鈕群 */}
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
