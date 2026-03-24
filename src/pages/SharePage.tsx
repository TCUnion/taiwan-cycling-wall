import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Share2, MessageCircle } from 'lucide-react'
import { toPng } from 'html-to-image'
import { useEventStore } from '../stores/eventStore'
import Button from '../components/ui/Button'
import OGImageGenerator from '../components/share/OGImageGenerator'

export default function SharePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const 活動列表 = useEventStore(s => s.活動列表)
  const 活動 = 活動列表.find(e => e.id === id)

  const ogRef = useRef<HTMLDivElement>(null)
  const [預覽圖, set預覽圖] = useState<string | null>(null)
  const [生成中, set生成中] = useState(false)

  if (!活動) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-cork">
        <p>找不到活動</p>
      </div>
    )
  }

  // 生成 OG 圖片
  const 生成圖片 = async () => {
    if (!ogRef.current) return
    set生成中(true)
    try {
      const dataUrl = await toPng(ogRef.current, {
        width: 1200,
        height: 630,
        pixelRatio: 1,
      })
      set預覽圖(dataUrl)
    } catch (err) {
      console.error('生成圖片失敗:', err)
    }
    set生成中(false)
  }

  // 下載圖片
  const 下載圖片 = () => {
    if (!預覽圖) return
    const link = document.createElement('a')
    link.download = `約騎-${活動.title}.png`
    link.href = 預覽圖
    link.click()
  }

  // Web Share API
  const 分享 = async () => {
    const shareData: ShareData = {
      title: `🚴 ${活動.title} — 台灣約騎事件簿`,
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
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={22} /></button>
        <h1 className="text-lg font-bold">分享活動</h1>
      </div>

      {/* 隱藏的 OG 圖片 DOM */}
      <OGImageGenerator ref={ogRef} 活動={活動} />

      <div className="px-4 space-y-6">
        {/* 預覽區 */}
        <div className="rounded-xl overflow-hidden shadow-lg bg-white">
          {預覽圖 ? (
            <img src={預覽圖} alt="分享圖片預覽" className="w-full" />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <p className="text-lg">📸</p>
              <p className="text-sm mt-2">點擊下方按鈕生成分享圖片</p>
            </div>
          )}
        </div>

        {/* 生成按鈕 */}
        {!預覽圖 && (
          <Button fullWidth onClick={生成圖片} disabled={生成中}>
            {生成中 ? '生成中...' : '🖼️ 生成分享圖片'}
          </Button>
        )}

        {/* 分享按鈕群 */}
        {預覽圖 && (
          <div className="space-y-3">
            <Button fullWidth onClick={下載圖片}>
              <Download size={18} /> 下載圖片
            </Button>
            <Button fullWidth variant="outline" onClick={分享}>
              <Share2 size={18} /> 分享連結
            </Button>
            <a href={LINE連結} target="_blank" rel="noopener noreferrer">
              <Button fullWidth variant="line" className="mt-3">
                <MessageCircle size={18} /> 分享到 LINE
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
