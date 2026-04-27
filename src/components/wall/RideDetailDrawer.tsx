import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Calendar, MapPin, Mountain, Route, X } from 'lucide-react'
import type { CyclingEvent } from '../../types'
import { 查找縣市 } from '../../data/counties'
import { useAuthStore } from '../../stores/authStore'
import { 格式化完整日期, 格式化距離 } from '../../utils/formatters'
import VerifiedBadge from '../ui/VerifiedBadge'
import EventWeatherCard from '../event/EventWeatherCard'
import { useRouteInfo } from '../../hooks/useRouteInfo'

interface Props {
  活動: CyclingEvent | null
  onClose: () => void
}

const 區域文字色: Record<CyclingEvent['region'], string> = {
  '北部': 'text-region-north',
  '中部': 'text-region-central',
  '南部': 'text-region-south',
  '東部': 'text-region-east',
}

const 區域上框: Record<CyclingEvent['region'], string> = {
  '北部': 'border-t-region-north',
  '中部': 'border-t-region-central',
  '南部': 'border-t-region-south',
  '東部': 'border-t-region-east',
}

export default function RideDetailDrawer({ 活動, onClose }: Props) {
  const navigate = useNavigate()
  const 所有使用者 = useAuthStore(s => s.所有使用者)

  useEffect(() => {
    if (!活動) return
    const 處理鍵盤 = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', 處理鍵盤)
    return () => document.removeEventListener('keydown', 處理鍵盤)
  }, [活動, onClose])

  // 距離 / 爬升 fallback：DB 存 0 但有 Strava URL → 現場補抓
  const 路線資訊補抓 = useRouteInfo(活動?.stravaRouteUrl, !!活動 && (活動.distance === 0 && 活動.elevation === 0))

  if (!活動) return null

  const 縣市 = 查找縣市(活動.countyId)
  const 顯示距離 = 活動.distance > 0 ? 活動.distance : (路線資訊補抓?.distance ?? 0)
  const 顯示爬升 = 活動.elevation > 0 ? 活動.elevation : (路線資訊補抓?.elevation ?? 0)
  const 是粉絲頁活動 = 活動.creatorId.startsWith('page-')
  const 粉絲頁Id = 是粉絲頁活動 ? 活動.creatorId.replace('page-', '') : ''
  const 粉絲頁資訊 = 是粉絲頁活動 ? 所有使用者.flatMap(u => u.managedPages ?? []).find(p => p.pageId === 粉絲頁Id) : undefined
  const 發起人 = 是粉絲頁活動
    ? 所有使用者.find(u => u.managedPages?.some(p => p.pageId === 粉絲頁Id))
    : 所有使用者.find(u => u.id === 活動.creatorId)
  const 發起名稱 = 是粉絲頁活動 ? 粉絲頁資訊?.name : 發起人?.name
  const 發起頭像 = 是粉絲頁活動 ? 粉絲頁資訊?.pictureUrl : 發起人?.avatar
  const 頭像是網址 = 發起頭像?.startsWith('http')
  const 描述摘要 = 活動.description.replace(/[#*_`>-]/g, '').replace(/\n{2,}/g, '\n').trim()

  const 前往詳情 = () => {
    onClose()
    navigate(`/event/${活動.id}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-siokiu-ink/55 animate-[siokiu-fade-in_200ms_var(--siokiu-ease-out)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ride-detail-title"
      onClick={onClose}
    >
      <div
        className={`max-h-[88svh] w-full overflow-y-auto border-t-4 ${區域上框[活動.region]} bg-siokiu-paper text-siokiu-ink shadow-2xl animate-[siokiu-slide-up_260ms_var(--siokiu-ease-out)]`}
        onClick={event => event.stopPropagation()}
      >
        <div className="border-b border-siokiu-border px-5 py-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className={`siokiu-eyebrow ${區域文字色[活動.region]}`}>
              {活動.region} · {縣市?.name ?? '台灣'}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉活動摘要"
              className="grid min-h-11 min-w-11 place-items-center text-siokiu-smoke transition-colors hover:text-siokiu-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siokiu-red/30 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
          <h2 id="ride-detail-title" className="font-serif text-[1.85rem] font-black leading-[1.05] tracking-normal text-siokiu-ink">
            {活動.title}
          </h2>
          {發起名稱 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden bg-siokiu-ink font-serif text-xs font-black text-siokiu-paper">
                {頭像是網址 ? (
                  <img src={發起頭像} alt={發起名稱} className="h-full w-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                ) : (
                  發起名稱.slice(0, 1)
                )}
              </span>
              <span className="text-xs font-medium text-siokiu-ink">{發起名稱} 發起</span>
              {發起人?.verifiedAt && <VerifiedBadge size="sm" />}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 border-b border-siokiu-border">
          <DrawerStat icon={<Route size={16} />} label="距離" value={顯示距離 > 0 ? 格式化距離(顯示距離) : '未填'} />
          <DrawerStat icon={<Mountain size={16} />} label="爬升" value={顯示爬升 > 0 ? `${顯示爬升} m` : '未填'} />
          <DrawerStat label="配速" value={活動.pace || '自由配速'} />
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow icon={<Calendar size={17} />} label="集合時間" value={`${格式化完整日期(活動.date)} ${活動.time}`} />
            <InfoRow icon={<MapPin size={17} />} label="集合地點" value={活動.meetingPoint || 縣市?.name || '未填寫'} />
          </div>

          <EventWeatherCard
            座標={活動.routeCoordinates ?? []}
            日期={活動.date}
            時間={活動.time}
            縣市Id={活動.countyId}
            集合地點={活動.meetingPoint}
            集合地點URL={活動.meetingPointUrl}
            活動標題={活動.title}
          />

          {描述摘要 && (
            <section>
              <span className="siokiu-eyebrow text-siokiu-smoke">路線說明</span>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-siokiu-ink">{描述摘要}</p>
            </section>
          )}

          {活動.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {活動.tags.map(tag => (
                <span key={tag} className="border border-siokiu-border px-2 py-1 text-[0.68rem] text-siokiu-smoke">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={前往詳情}
            className="flex min-h-11 w-full items-center justify-center gap-2 bg-siokiu-ink px-4 py-3 text-sm font-medium tracking-[0.14em] text-siokiu-paper transition-colors hover:bg-siokiu-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siokiu-red/30 cursor-pointer"
          >
            查看完整詳情
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function DrawerStat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border-r border-siokiu-border px-3 py-4 last:border-r-0">
      <div className="mb-2 flex items-center gap-1.5 text-siokiu-smoke">
        {icon}
        <span className="siokiu-eyebrow">{label}</span>
      </div>
      <div className="font-serif text-xl font-black leading-none text-siokiu-ink">{value}</div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 border border-siokiu-border bg-white/35 p-3">
      <div className="mt-0.5 text-siokiu-red">{icon}</div>
      <div className="min-w-0">
        <div className="siokiu-eyebrow text-siokiu-smoke">{label}</div>
        <div className="mt-1 text-sm font-medium leading-5 text-siokiu-ink">{value}</div>
      </div>
    </div>
  )
}
