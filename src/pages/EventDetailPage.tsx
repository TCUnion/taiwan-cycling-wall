// 活動詳情頁面

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Mountain, Route, ExternalLink, Share2, Zap, Link, AlertCircle, Pencil, Loader2 } from 'lucide-react'
import { useEventStore } from '../stores/eventStore'
import { useAuthStore } from '../stores/authStore'
import { 取得使用者 } from '../utils/userService'
import { useAds } from '../hooks/useAds'
import { 查找縣市 } from '../data/counties'
import { 格式化完整日期, 格式化距離 } from '../utils/formatters'
import { 區域背景色 } from '../utils/regionMapping'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import MoakBadge from '../components/event/MoakBadge'
import VerifiedBadge from '../components/ui/VerifiedBadge'
import { 安全渲染Markdown, 安全URL, 淨化純文字 } from '../utils/sanitize'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { 使用者, 所有使用者 } = useAuthStore()
  const { 活動列表, 載入單一活動 } = useEventStore()
  const { 廣告列表 } = useAds()
  const 廣告 = 廣告列表[0] // 顯示一則廣告

  const [載入失敗, set載入失敗] = useState(false)

  const 活動 = 活動列表.find(e => e.id === id)
  // 有活動就不需要載入；沒活動就視為載入中
  const [載入中, set載入中] = useState(!活動)

  useEffect(() => {
    if (!id || 活動) { set載入中(false); return }
    set載入中(true)
    set載入失敗(false)
    載入單一活動(id)
      .then((result) => {
        if (!result) set載入失敗(true)
      })
      .catch(() => set載入失敗(true))
      .finally(() => set載入中(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 背景載入發起人資料（如果 store 中找不到）
  useEffect(() => {
    if (!活動) return
    const creatorId = 活動.creatorId
    if (creatorId.startsWith('page-')) return // 粉絲頁另行處理
    const 已有 = 所有使用者.find(u => u.id === creatorId)
    if (已有) return
    取得使用者(creatorId).then((遠端使用者) => {
      if (!遠端使用者 || !遠端使用者.id) return
      // 以最小欄位 merge 進 store
      useAuthStore.setState((s) => {
        if (s.所有使用者.some(u => u.id === 遠端使用者.id)) return s
        return { 所有使用者: [...s.所有使用者, 遠端使用者 as import('../types').User] }
      })
    })
  }, [活動, 所有使用者])

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
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-lg font-medium">{載入失敗 ? '找不到這個活動' : '載入中…'}</p>
          <Button variant="ghost" onClick={() => navigate('/wall')} className="mt-4">回到公布欄</Button>
        </div>
      </div>
    )
  }

  const 縣市 = 查找縣市(活動.countyId)
  // 粉絲頁發起的活動：creatorId 為 page-{pageId}，發起人是管理該頁的使用者
  const 是粉絲頁活動 = 活動.creatorId.startsWith('page-')
  const 粉絲頁Id = 是粉絲頁活動 ? 活動.creatorId.replace('page-', '') : ''
  const 是發起人 = 使用者 ? (
    活動.creatorId === 使用者.id ||
    (是粉絲頁活動 && 使用者.managedPages?.some(p => p.pageId === 粉絲頁Id))
  ) : false
  // 粉絲頁活動：顯示粉絲頁名稱/頭像；個人活動：從所有使用者查找
  const 粉絲頁資訊 = 是粉絲頁活動 ? 所有使用者.flatMap(u => u.managedPages ?? []).find(p => p.pageId === 粉絲頁Id) : undefined
  const 發起人 = 是粉絲頁活動
    ? (粉絲頁資訊 ? { id: 活動.creatorId, name: 粉絲頁資訊.name, avatar: 粉絲頁資訊.pictureUrl } as { id: string; name: string; avatar: string } : undefined)
    : 所有使用者.find(u => u.id === 活動.creatorId)

  const 導航連結 = 活動.meetingPoint
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(活動.meetingPoint)}`
    : ''

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
        {/* 區域 Badge + 發起人（右側） */}
        <div className="flex items-center justify-between">
          <Badge variant="region" region={活動.region}>{活動.region} · {縣市?.name}</Badge>
          {發起人 && (
            <div className="flex items-center gap-2">
              <Avatar emoji={發起人.avatar} size="sm" />
              <span className="text-sm text-gray-600">{發起人.name} 發起</span>
              {(() => {
                if (是粉絲頁活動) {
                  const 管理者 = 所有使用者.find(u => u.managedPages?.some(p => p.pageId === 粉絲頁Id))
                  return 管理者?.verifiedAt ? <VerifiedBadge size="md" /> : null
                }
                const 使用者發起人 = 所有使用者.find(u => u.id === 活動.creatorId)
                return 使用者發起人?.verifiedAt ? <VerifiedBadge size="md" /> : null
              })()}
            </div>
          )}
        </div>

        {/* 標題 */}
        <h1 className="text-2xl font-bold -mt-2">{活動.title}</h1>

        {/* === 資訊卡片區 === */}
        <div className="space-y-2">
          {/* 圖章 + 日期/集合地點：手機垂直、桌面水平 */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* 圖章 */}
            {(() => {
              const 發起人資料 = !是粉絲頁活動 ? 所有使用者.find(u => u.id === 活動.creatorId) : undefined
              const 圖章 = 活動.coverImage || 發起人資料?.stampImages?.[0] || 發起人資料?.stampImage
              return 圖章 ? (
                <span className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-white/80 border border-gray-200 shadow-sm overflow-hidden inline-flex items-center justify-center p-1">
                  <img src={圖章} alt="活動圖章" className="w-full h-full object-contain" loading="lazy" />
                </span>
              ) : null
            })()}
            {/* 日期 + 集合地點 */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InfoCard icon={<Calendar size={18} />} label="約騎日期" value={`${格式化完整日期(活動.date)}　${活動.time} 集合`} />
              {活動.meetingPoint && (
                <div className="flex items-start gap-2.5 rounded-xl bg-white p-3 shadow-sm">
                  <div className="text-strava mt-0.5"><MapPin size={18} /></div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">集合地點</p>
                    <p className="font-medium text-sm truncate">{活動.meetingPoint}</p>
                    <a href={安全URL(活動.meetingPointUrl) || 導航連結} target="_blank" rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] text-strava cursor-pointer hover:underline">
                      <ExternalLink size={10} /> Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* 數據列（配速/距離/爬升） */}
          {(() => {
            const 有路線嵌入 = 活動.stravaRouteUrl && (
              /strava\.com\/routes\/\d+/.test(活動.stravaRouteUrl) ||
              /ridewithgps\.com\/routes\/\d+/.test(活動.stravaRouteUrl)
            )
            const 數據項: { icon: React.ReactNode; label: string; value: string }[] = []
            if (!有路線嵌入 && 活動.distance > 0) 數據項.push({ icon: <Route size={16} />, label: '距離', value: 格式化距離(活動.distance) })
            if (!有路線嵌入 && 活動.elevation > 0) 數據項.push({ icon: <Mountain size={16} />, label: '爬升', value: `${活動.elevation} m` })
            if (活動.pace !== '自由配速') {
              const 配速描述: Record<string, string> = {
                '輕鬆騎': '邊騎邊聊天，享受風景',
                '休閒騎': '輕鬆節奏，適合所有人',
                '中等強度': '穩定配速，有一定體能需求',
                '進階挑戰': '丘陵爬坡，需要訓練基礎',
                '比賽強度': '高強度騎乘，適合有經驗車手',
              }
              const 描述 = 配速描述[活動.pace]
              數據項.push({ icon: <Zap size={16} />, label: '配速', value: 描述 ? `${活動.pace} — ${描述}` : 活動.pace })
            }
            if (數據項.length === 0) return null
            return (
              <div className={`grid gap-2 ${數據項.length === 1 ? 'grid-cols-1' : 數據項.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {數據項.map(d => <InfoCard key={d.label} icon={d.icon} label={d.label} value={d.value} />)}
              </div>
            )
          })()}
        </div>

        {/* 廣告 */}
        {廣告 && (
          <a
            href={安全URL(廣告.product_url) ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl bg-white shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4 p-4">
              <div className="w-28 shrink-0 self-stretch rounded-lg overflow-hidden bg-gray-50">
                <img src={安全URL(廣告.image_url) ?? ''} alt={淨化純文字(廣告.product_name)} className="w-full h-full object-contain" loading="lazy" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-xs text-strava font-medium">{淨化純文字(廣告.brand_name)}</p>
                <h3 className="font-bold text-sm leading-snug mt-0.5 line-clamp-2">{淨化純文字(廣告.product_name)}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{淨化純文字(廣告.placement_text ?? '')}</p>
              </div>
              <div className="flex items-center shrink-0 text-gray-400">
                <ExternalLink size={18} />
              </div>
            </div>
          </a>
        )}

        {/* 路線連結（無法嵌入地圖的平台：Garmin 等） */}
        {活動.stravaRouteUrl && 安全URL(活動.stravaRouteUrl)
          && !活動.stravaRouteUrl.includes('strava.com/routes/')
          && !活動.stravaRouteUrl.includes('ridewithgps.com/routes/') && (
          <a href={安全URL(活動.stravaRouteUrl)!} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-strava shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
            <Link size={18} />
            <span className="font-medium">{路線連結類型(活動.stravaRouteUrl)}：查看路線</span>
            <ExternalLink size={14} className="ml-auto" />
          </a>
        )}

        {/* 活動說明（路線描述 + 注意事項，支援簡易 Markdown，DOMPurify 淨化） */}
        {活動.description && (
          <div className="rounded-xl bg-white p-4 shadow-sm text-sm text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_li]:my-0.5"
               dangerouslySetInnerHTML={{ __html: 安全渲染Markdown(活動.description) }} />
        )}

        {/* MOAK 認證 */}
        {活動.moakEventId && <MoakBadge moakEventId={活動.moakEventId} />}

        {/* 操作按鈕 */}
        {是發起人 && (
          <div className="pt-2">
            <Button fullWidth variant="primary" onClick={() => navigate(`/event/${活動.id}/edit`)}>
              <Pencil size={16} /> 編輯活動
            </Button>
          </div>
        )}

      </div>

      {/* 路線地圖 embed（Strava / Ride with GPS）— 全寬，與便當格同寬 */}
      {活動.stravaRouteUrl && 安全URL(活動.stravaRouteUrl) && (() => {
        const url = 安全URL(活動.stravaRouteUrl)!
        const stravaMatch = url.match(/strava\.com\/routes\/(\d+)/)
        const rwgpsMatch = url.match(/ridewithgps\.com\/routes\/(\d+)/)
        // Garmin 已封鎖 iframe embed，不支援
        if (!stravaMatch && !rwgpsMatch) return null
        return (
          <div className="px-4 mt-4">
            <div className="rounded-xl bg-white shadow-sm overflow-hidden">
              {stravaMatch && <StravaRouteEmbed routeId={stravaMatch[1]} />}
              {rwgpsMatch && (
                <iframe
                  title="Ride with GPS 路線預覽"
                  src={`https://ridewithgps.com/embeds?type=route&id=${rwgpsMatch[1]}&sampleGraph=true`}
                  className="w-full border-0"
                  style={{ height: 500 }}
                  loading="lazy"
                  allowFullScreen={false}
                />
              )}
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 text-sm text-strava cursor-pointer hover:bg-gray-50 transition-colors border-t border-gray-100">
                <Link size={18} />
                <span className="font-medium">{路線連結類型(url)}：查看路線</span>
                <ExternalLink size={14} className="ml-auto" />
              </a>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

/** Strava 路線 embed — 使用 iframe 直接嵌入（比 embed.js 更穩定） */
function StravaRouteEmbed({ routeId }: { routeId: string }) {
  return (
    <iframe
      title="Strava 路線預覽"
      src={`https://strava-embeds.com/route/${routeId}`}
      className="w-full border-0"
      style={{ height: 500 }}
      loading="lazy"
      allowFullScreen={false}
    />
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
