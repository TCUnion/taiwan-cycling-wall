import { Loader2, Inbox } from 'lucide-react'
import type { CyclingEvent } from '../../types'
import { 查找縣市 } from '../../data/counties'
import { useAuthStore } from '../../stores/authStore'
import { 解析日期, 解析發起人, REGION_INK } from './wallShared'
import VerifiedBadge from '../ui/VerifiedBadge'
import EventWeatherInline from '../event/EventWeatherInline'

interface Props {
  活動列表: CyclingEvent[]
  onOpenActivity: (活動: CyclingEvent) => void
  載入中?: boolean
}

// 報紙式排版 — 序號 + hairline + 大 serif 標題 + mono 數據
export default function WallNewsprint({ 活動列表, onOpenActivity, 載入中 = false }: Props) {
  const 所有使用者 = useAuthStore(s => s.所有使用者)

  if (載入中) {
    return (
      <div className="flex flex-col items-center justify-center bg-siokiu-paper py-24 text-siokiu-ink">
        <Loader2 size={32} className="mb-3 animate-spin text-siokiu-red" />
        <p className="text-sm">載入活動中…</p>
      </div>
    )
  }

  if (活動列表.length === 0) {
    return (
      <div className="flex min-h-[60svh] flex-col items-center justify-center bg-siokiu-paper px-4 py-24 text-center text-siokiu-ink">
        <Inbox size={48} className="mb-4 text-siokiu-ink/45" />
        <p className="font-serif text-2xl font-black">本期暫無刊登</p>
        <p className="mt-1 text-sm text-siokiu-smoke">成為第一個發起約騎的人吧！</p>
      </div>
    )
  }

  // 報頭：本期序號 + 全部數量
  const 本期 = String(活動列表.length).padStart(2, '0')

  return (
    <div className="min-h-[calc(100svh-112px)] bg-siokiu-paper pb-24 text-siokiu-ink">
      {/* 報頭 */}
      <div className="border-b border-siokiu-border px-5 pt-4 pb-3">
        <span className="text-[0.56rem] font-medium uppercase tracking-[0.3em] text-siokiu-smoke">
          {本期} · WEEKLY · 相揪約騎週報
        </span>
        <h2 className="mt-1 font-serif text-[2.1rem] font-black leading-[0.95] tracking-tight text-siokiu-ink">
          相揪約騎
        </h2>
        <p className="mt-1 font-serif text-xs italic text-siokiu-smoke">
          The Cyclist's Bulletin — 每週更新，車友共同登載
        </p>
      </div>

      {/* 條目 */}
      <div className="px-5">
        {活動列表.map((r, i) => {
          const d = 解析日期(r.date)
          const 縣市 = 查找縣市(r.countyId)
          const ink = REGION_INK[r.region]
          const 發起人 = 解析發起人(r, 所有使用者)

          return (
            <button
              key={r.id}
              onClick={() => onOpenActivity(r)}
              className="block w-full cursor-pointer border-b border-siokiu-border bg-transparent px-0 py-[18px] text-left transition-colors hover:bg-siokiu-ink/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siokiu-red/40"
            >
              {/* Row 1：序號 + 區域 + 日期 */}
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] text-siokiu-smoke">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="h-px w-6 bg-siokiu-ink" />
                  <span
                    className="inline-block h-[6px] w-[6px] shrink-0 rounded-full"
                    style={{ background: ink }}
                  />
                  <span
                    className="truncate text-[9px] font-medium uppercase tracking-[0.25em]"
                    style={{ color: ink }}
                  >
                    {r.region} · {縣市?.name ?? '台灣'}
                  </span>
                </div>
                <div className="shrink-0 font-mono text-[11px] font-medium text-siokiu-ink whitespace-nowrap">
                  {d?.short ?? r.date} <span className="text-siokiu-smoke">週{d?.W ?? '-'}</span> · {r.time}
                </div>
              </div>

              {/* Row 2：大 serif 標題 */}
              <h3 className="mb-1.5 font-serif text-[1.55rem] font-black leading-[1.05] tracking-tight text-siokiu-ink">
                {r.title}
              </h3>

              {/* Row 3：集合點 + 描述 */}
              <p className="mb-2.5 line-clamp-2 text-[12px] leading-[1.55] text-siokiu-smoke">
                集合於 {r.meetingPoint || 縣市?.name || '待公布'}
                {r.description ? ` — ${r.description}` : ''}
              </p>

              {/* Row 4：mono 數據 */}
              <div className="flex items-end gap-[18px] font-mono">
                <Stat label="DIST" value={r.distance > 0 ? String(r.distance) : '-'} unit="km" />
                <Stat label="ELEV" value={r.elevation > 0 ? String(r.elevation) : '-'} unit="m" />
                <div>
                  <div className="text-[8.5px] uppercase tracking-[0.25em] text-siokiu-smoke">PACE</div>
                  <div className="mt-[3px] text-[13px] font-medium leading-none text-siokiu-ink">
                    {r.pace || '自由'}
                  </div>
                </div>
                <div className="ml-auto">
                  <EventWeatherInline 活動={r} />
                </div>
              </div>

              {/* Row 5：發起人 */}
              <div className="mt-2.5 flex items-center gap-2">
                <span className="grid h-[18px] w-[18px] place-items-center bg-siokiu-ink font-serif text-[10px] font-black text-siokiu-paper">
                  {發起人.名稱.slice(0, 1)}
                </span>
                <span className="text-[11px] font-medium text-siokiu-ink">{發起人.名稱}</span>
                {發起人.verified && <VerifiedBadge size="sm" />}
                <div className="flex-1" />
                <span className="font-serif text-[14px] font-black text-siokiu-red">→</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="text-[8.5px] uppercase tracking-[0.25em] text-siokiu-smoke">{label}</div>
      <div className="text-[18px] font-medium leading-none text-siokiu-ink">
        {value}
        <span className="ml-[2px] text-[10px] text-siokiu-smoke">{unit}</span>
      </div>
    </div>
  )
}
