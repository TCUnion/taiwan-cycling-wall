import { Calendar, Gauge, MapPin, Mountain, Route } from 'lucide-react'
import type { CyclingEvent, StickyColor } from '../../types'
import { 查找縣市 } from '../../data/counties'
import { useAuthStore } from '../../stores/authStore'
import { 格式化距離 } from '../../utils/formatters'
import { 取得旋轉角度 } from '../../stores/eventStore'
import VerifiedBadge from '../ui/VerifiedBadge'
import EventWeatherInline from '../event/EventWeatherInline'

// 便利貼背景色對照
const 背景色: Record<StickyColor, string> = {
  yellow: 'bg-sticky-yellow',
  pink: 'bg-sticky-pink',
  blue: 'bg-sticky-blue',
  green: 'bg-sticky-green',
}

// 區域色帶對照 — 便利貼左側色帶
const 區域色帶: Record<string, string> = {
  '北部': 'bg-region-north',
  '中部': 'bg-region-central',
  '南部': 'bg-region-south',
  '東部': 'bg-region-east',
}

interface Props {
  活動: CyclingEvent
  onOpen: (活動: CyclingEvent) => void
}

export default function StickyNoteCard({ 活動, onOpen }: Props) {
  const 所有使用者 = useAuthStore(s => s.所有使用者)
  const 縣市 = 查找縣市(活動.countyId)
  const 旋轉class = 取得旋轉角度(活動.id)

  // 粉絲頁發起人資訊
  const 是粉絲頁活動 = 活動.creatorId.startsWith('page-')
  const 粉絲頁Id = 是粉絲頁活動 ? 活動.creatorId.replace('page-', '') : ''
  const 粉絲頁資訊 = 是粉絲頁活動 ? 所有使用者.flatMap(u => u.managedPages ?? []).find(p => p.pageId === 粉絲頁Id) : undefined

  const 發起人 = 是粉絲頁活動
    ? 所有使用者.find(u => u.managedPages?.some(p => p.pageId === 粉絲頁Id))
    : 所有使用者.find(u => u.id === 活動.creatorId)
  const 名稱 = 是粉絲頁活動 ? 粉絲頁資訊?.name : 發起人?.name

  const 日期 = new Date(`${活動.date}T00:00:00`)
  const 月日 = Number.isNaN(日期.getTime())
    ? 活動.date
    : `${String(日期.getMonth() + 1).padStart(2, '0')}.${String(日期.getDate()).padStart(2, '0')}`

  return (
    <button
      onClick={() => onOpen(活動)}
      className={`
        ${背景色[活動.stickyColor]} ${旋轉class}
        relative min-h-[190px] w-full overflow-visible rounded-none border-0
        p-3 pt-4 pb-16 text-left text-siokiu-ink shadow-[0_4px_10px_rgba(60,40,20,0.22),0_1px_2px_rgba(60,40,20,0.15)]
        hover:z-10 hover:shadow-[0_8px_18px_rgba(60,40,20,0.28),0_2px_5px_rgba(60,40,20,0.18)]
        motion-safe:hover:scale-[1.025]
        transition-[transform,box-shadow] duration-200 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siokiu-red/40
      `}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${區域色帶[活動.region]}`} />

      <span className="siokiu-pushpin absolute -top-1.5 left-1/2 z-10 -translate-x-1/2" aria-hidden="true" />

      {/* 發起人圖章或頭像 — 右下角（優先用活動儲存的 coverImage，再找使用者的 stampImage） */}
      {(() => {
        const 個人發起人 = 所有使用者.find(u => u.id === 活動.creatorId)
        const 圖章 = 活動.coverImage || 個人發起人?.stampImages?.[0] || 個人發起人?.stampImage
        if (圖章) {
          return (
            <span className="absolute bottom-3 right-3 inline-flex h-12 w-12 items-center justify-center overflow-hidden border border-siokiu-ink/10 bg-white/70 shadow-sm sm:h-14 sm:w-14">
              <img src={圖章} alt="活動圖章" className="w-full h-full object-cover" loading="lazy" />
            </span>
          )
        }
        const 頭像 = 是粉絲頁活動 ? 粉絲頁資訊?.pictureUrl : 個人發起人?.avatar
        const 是網址 = 頭像?.startsWith('http')
        return 頭像 ? (
          <span className="absolute bottom-3 right-3 inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-siokiu-ink/10 bg-white/70 text-sm font-bold shadow-sm sm:h-14 sm:w-14">
            {是網址 ? (
              <img src={頭像} alt="發起人頭像" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
            ) : 名稱?.slice(0, 1)}
          </span>
        ) : null
      })()}

      <div className="mb-1.5 mt-1 flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${區域色帶[活動.region]}`} />
        <span className="siokiu-eyebrow truncate text-siokiu-smoke">{活動.region} · {縣市?.name ?? '台灣'}</span>
      </div>

      <div className="absolute right-2.5 top-[3.8rem] font-mono text-right text-siokiu-ink">
        <div className="text-[0.62rem] tracking-[0.08em] opacity-60">{月日}</div>
        <div className="text-[0.7rem] font-semibold">{活動.time}</div>
      </div>

      <h3 className="mb-2 line-clamp-2 pr-10 font-serif text-[1.08rem] font-black leading-[1.15] tracking-normal text-siokiu-ink">
        {活動.title}
      </h3>

      <div className="mb-2 h-px bg-siokiu-ink/15" />

      <div className="mb-2 grid grid-cols-3 gap-2">
        <Metric icon={<Route size={12} />} label="KM" value={活動.distance > 0 ? 格式化距離(活動.distance).replace(' km', '') : '-'} />
        <Metric icon={<Mountain size={12} />} label="M↑" value={活動.elevation > 0 ? String(活動.elevation) : '-'} />
        <Metric icon={<Gauge size={12} />} label="配速" value={活動.pace || '自由'} small />
      </div>

      <div className="mb-2 flex items-center gap-1.5 text-[0.68rem] text-siokiu-ink/70">
        <Calendar size={12} className="shrink-0" />
        <span className="truncate">{活動.date} {活動.time}</span>
      </div>
      <div className="mb-2 flex items-center gap-1.5 text-[0.68rem] text-siokiu-ink/70">
        <MapPin size={12} className="shrink-0" />
        <span className="truncate">{活動.meetingPoint || 縣市?.name || '集合地點未填'}</span>
      </div>

      <div className="mb-3">
        <EventWeatherInline 活動={活動} />
      </div>

      {名稱 && (
        <div className="absolute bottom-3 left-3 right-[4.75rem] flex items-center gap-2 sm:right-[5.25rem]">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="grid h-5 w-5 shrink-0 place-items-center bg-siokiu-ink font-serif text-[0.65rem] font-black text-siokiu-paper">
              {名稱.slice(0, 1)}
            </span>
            <span className="truncate text-[0.68rem] font-medium text-siokiu-ink">{名稱}</span>
            {發起人?.verifiedAt && <VerifiedBadge size="sm" />}
          </div>
        </div>
      )}
    </button>
  )
}

function Metric({ icon, label, value, small = false }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-1 text-[0.46rem] uppercase tracking-[0.2em] text-siokiu-smoke">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`truncate font-mono font-semibold leading-none text-siokiu-ink ${small ? 'text-[0.68rem]' : 'text-[0.95rem]'}`}>
        {value}
      </div>
    </div>
  )
}
