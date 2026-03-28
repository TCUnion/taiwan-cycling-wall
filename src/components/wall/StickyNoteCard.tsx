import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Mountain, Route } from 'lucide-react'
import type { CyclingEvent, StickyColor } from '../../types'
import { 查找縣市 } from '../../data/counties'
import { useAuthStore } from '../../stores/authStore'
import { 格式化日期, 格式化距離 } from '../../utils/formatters'
import { 取得旋轉角度 } from '../../stores/eventStore'
import Badge from '../ui/Badge'
import VerifiedBadge from '../ui/VerifiedBadge'
import { useEventStore } from '../../stores/eventStore'

// 便利貼背景色對照
const 背景色: Record<StickyColor, string> = {
  yellow: 'bg-sticky-yellow',
  pink: 'bg-sticky-pink',
  blue: 'bg-sticky-blue',
  green: 'bg-sticky-green',
}

// 區域色帶對照 — 便利貼頂部色帶
const 區域色帶: Record<string, string> = {
  '北部': 'bg-region-north',
  '中部': 'bg-region-central',
  '南部': 'bg-region-south',
  '東部': 'bg-region-east',
}

interface Props {
  活動: CyclingEvent
}

export default function StickyNoteCard({ 活動 }: Props) {
  const navigate = useNavigate()
  const 所有使用者 = useAuthStore(s => s.所有使用者)
  const 篩選區域 = useEventStore(s => s.篩選區域)
  const 縣市 = 查找縣市(活動.countyId)
  const 旋轉class = 取得旋轉角度(活動.id)

  // 粉絲頁發起人資訊
  const 是粉絲頁活動 = 活動.creatorId.startsWith('page-')
  const 粉絲頁Id = 是粉絲頁活動 ? 活動.creatorId.replace('page-', '') : ''
  const 粉絲頁資訊 = 是粉絲頁活動 ? 所有使用者.flatMap(u => u.managedPages ?? []).find(p => p.pageId === 粉絲頁Id) : undefined

  return (
    <button
      onClick={() => navigate(`/event/${活動.id}`)}
      className={`
        ${背景色[活動.stickyColor]} ${旋轉class}
        relative w-full text-left rounded-sm shadow-md
        hover:shadow-lg motion-safe:hover:scale-105 hover:z-10
        transition-[transform,box-shadow] duration-200 cursor-pointer
        p-4 pt-6
      `}
    >
      {/* 區域色帶 — 頂部 */}
      <div className={`absolute top-0 left-0 right-0 h-2 rounded-t-sm ${區域色帶[活動.region]}`} />

      {/* 圖釘裝飾 */}
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400 border-2 border-red-600 shadow-sm z-10" />

      {/* 發起人圖章或頭像 — 右上角（優先用活動儲存的 coverImage，再找使用者的 stampImage） */}
      {(() => {
        const 發起人 = 所有使用者.find(u => u.id === 活動.creatorId)
        const 圖章 = 活動.coverImage || 發起人?.stampImages?.[0] || 發起人?.stampImage
        if (圖章) {
          return (
            <span className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-white/80 border border-gray-200 shadow-sm overflow-hidden inline-flex items-center justify-center">
              <img src={圖章} alt="活動圖章" className="w-full h-full object-cover" loading="lazy" />
            </span>
          )
        }
        const 頭像 = 是粉絲頁活動 ? 粉絲頁資訊?.pictureUrl : 發起人?.avatar
        const 是網址 = 頭像?.startsWith('http')
        return 頭像 ? (
          <span className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/80 border border-gray-200 shadow-sm overflow-hidden inline-flex items-center justify-center text-lg">
            {是網址 ? (
              <img src={頭像} alt="發起人頭像" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
            ) : 頭像}
          </span>
        ) : null
      })()}

      {/* 標題 */}
      <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2 pr-12">{活動.title}</h3>

      {/* 粉絲頁發起人 */}
      {是粉絲頁活動 && 粉絲頁資訊 && (
        <div className="flex items-center gap-1 mb-1.5">
          {粉絲頁資訊.pictureUrl ? (
            <img src={粉絲頁資訊.pictureUrl} alt={粉絲頁資訊.name} className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
          ) : null}
          <span className="text-[10px] text-gray-500 truncate">{粉絲頁資訊.name}</span>
          {(() => {
            const 管理者 = 所有使用者.find(u => u.managedPages?.some(p => p.pageId === 粉絲頁Id))
            return 管理者?.verifiedAt ? <VerifiedBadge size="sm" /> : null
          })()}
        </div>
      )}

      {/* 個人發起人認證 Badge */}
      {!是粉絲頁活動 && (() => {
        const 發起人 = 所有使用者.find(u => u.id === 活動.creatorId)
        return 發起人?.verifiedAt ? (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] text-gray-500 truncate">{發起人.name}</span>
            <VerifiedBadge size="sm" />
          </div>
        ) : null
      })()}

      {/* 資訊列 */}
      <div className="space-y-1.5 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="shrink-0" />
          <span>{格式化日期(活動.date)} {活動.time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">
            {活動.meetingPoint ? `${活動.meetingPoint}（${縣市?.name}）` : 縣市?.name}
          </span>
        </div>
        {(活動.distance > 0 || 活動.elevation > 0) && (
          <div className="flex items-center gap-3">
            {活動.distance > 0 && (
              <span className="flex items-center gap-1">
                <Route size={12} />
                {格式化距離(活動.distance)}
              </span>
            )}
            {活動.elevation > 0 && (
              <span className="flex items-center gap-1">
                <Mountain size={12} />
                {活動.elevation}m
              </span>
            )}
          </div>
        )}
      </div>

      {篩選區域 === null && (
        <div className="mt-1">
          <Badge variant="region" region={活動.region}>
            {活動.region}
          </Badge>
        </div>
      )}
    </button>
  )
}
