import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Mountain, Users, Route } from 'lucide-react'
import type { CyclingEvent, StickyColor } from '../../types'
import { 查找縣市 } from '../../data/counties'
import { 格式化日期, 格式化距離 } from '../../utils/formatters'
import { 取得旋轉角度 } from '../../stores/eventStore'
import Badge from '../ui/Badge'

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
  const 縣市 = 查找縣市(活動.countyId)
  const 旋轉class = 取得旋轉角度(活動.id)

  return (
    <button
      onClick={() => navigate(`/event/${活動.id}`)}
      className={`
        ${背景色[活動.stickyColor]} ${旋轉class}
        relative w-full text-left rounded-sm shadow-md
        hover:shadow-lg hover:scale-105 hover:z-10
        transition-all duration-200 cursor-pointer
        p-4 pt-6
      `}
    >
      {/* 區域色帶 — 頂部 */}
      <div className={`absolute top-0 left-0 right-0 h-2 rounded-t-sm ${區域色帶[活動.region]}`} />

      {/* 圖釘裝飾 */}
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400 border-2 border-red-600 shadow-sm z-10" />

      {/* 標題 */}
      <h3 className="font-bold text-sm leading-tight mb-2 line-clamp-2">{活動.title}</h3>

      {/* 資訊列 */}
      <div className="space-y-1.5 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="shrink-0" />
          <span>{格式化日期(活動.date)} {活動.time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{縣市?.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Route size={12} />
            {格式化距離(活動.distance)}
          </span>
          {活動.elevation > 0 && (
            <span className="flex items-center gap-1">
              <Mountain size={12} />
              {活動.elevation}m
            </span>
          )}
        </div>
      </div>

      {/* 底部：參加人數 + 標籤 */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Users size={12} />
          <span>{活動.participants.length}/{活動.maxParticipants}</span>
        </div>
        <Badge variant="region" region={活動.region}>
          {活動.region}
        </Badge>
      </div>
    </button>
  )
}
