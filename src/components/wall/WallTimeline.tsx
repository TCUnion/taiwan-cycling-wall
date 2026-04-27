import { useMemo } from 'react'
import { Loader2, Inbox } from 'lucide-react'
import type { CyclingEvent } from '../../types'
import { 查找縣市 } from '../../data/counties'
import { 解析日期, REGION_INK } from './wallShared'

interface Props {
  活動列表: CyclingEvent[]
  onOpenActivity: (活動: CyclingEvent) => void
  載入中?: boolean
}

// 日程帳本 — 依日期分組，左側日期欄 + 右側活動清單
export default function WallTimeline({ 活動列表, onOpenActivity, 載入中 = false }: Props) {
  const 分組 = useMemo(() => {
    const map: Record<string, CyclingEvent[]> = {}
    活動列表.forEach(r => {
      ;(map[r.date] = map[r.date] || []).push(r)
    })
    return Object.keys(map)
      .sort()
      .map(date => ({ date, list: map[date] }))
  }, [活動列表])

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
        <p className="font-serif text-2xl font-black">目前沒有預定行程</p>
        <p className="mt-1 text-sm text-siokiu-smoke">成為第一個發起約騎的人吧！</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100svh-112px)] bg-siokiu-paper pb-24 text-siokiu-ink">
      {/* 報頭 */}
      <div className="border-b border-siokiu-border px-5 pt-4 pb-3">
        <span className="text-[0.56rem] font-medium uppercase tracking-[0.3em] text-siokiu-smoke">
          LEDGER · 依日程排列
        </span>
        <h2 className="mt-1 font-serif text-[1.85rem] font-black leading-[0.95] tracking-tight text-siokiu-ink">
          近期約騎
        </h2>
      </div>

      {分組.map(({ date, list }) => {
        const d = 解析日期(date)
        return (
          <div key={date} className="flex border-b border-siokiu-border">
            {/* 日期欄 */}
            <div className="w-[92px] shrink-0 border-r border-siokiu-border bg-siokiu-ink/[0.02] px-3 py-[18px] pl-5">
              <div className="font-serif text-[2.2rem] font-black leading-[0.9] tracking-tight text-siokiu-ink">
                {String(d?.D ?? 0).padStart(2, '0')}
              </div>
              <div className="mt-0.5 text-[11px] text-siokiu-smoke">
                {d?.M ?? '-'} 月 · 週{d?.W ?? '-'}
              </div>
              <div className="mt-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-siokiu-smoke">
                {list.length} RIDE{list.length > 1 ? 'S' : ''}
              </div>
            </div>

            {/* 活動列 */}
            <div className="flex-1 min-w-0">
              {list.map((r, i) => {
                const 縣市 = 查找縣市(r.countyId)
                const ink = REGION_INK[r.region]
                return (
                  <button
                    key={r.id}
                    onClick={() => onOpenActivity(r)}
                    className={`block w-full cursor-pointer bg-transparent px-5 py-4 text-left transition-colors hover:bg-siokiu-ink/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siokiu-red/40 ${
                      i < list.length - 1 ? 'border-b border-dashed border-siokiu-border' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 時間欄 */}
                      <div className="w-11 shrink-0 pt-[3px]">
                        <div className="font-mono text-[13px] font-semibold text-siokiu-ink">{r.time}</div>
                        <span
                          className="mt-1 inline-block h-[7px] w-[7px] rounded-full"
                          style={{ background: ink }}
                        />
                      </div>
                      {/* 主要內容 */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 line-clamp-2 font-serif text-[1.05rem] font-black leading-[1.1] tracking-tight text-siokiu-ink">
                          {r.title}
                        </div>
                        <div className="mb-2 truncate text-[11.5px] text-siokiu-smoke">
                          {縣市?.name ?? r.region} · {r.meetingPoint || '集合地點待公布'}
                        </div>
                        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 font-mono text-[11px] text-siokiu-ink">
                          <span>
                            {r.distance > 0 ? r.distance : '-'}
                            <span className="ml-px text-[9px] text-siokiu-smoke">km</span>
                          </span>
                          <span className="text-siokiu-border">|</span>
                          <span>
                            ↑{r.elevation > 0 ? r.elevation : '-'}
                            <span className="ml-px text-[9px] text-siokiu-smoke">m</span>
                          </span>
                          <span className="text-siokiu-border">|</span>
                          <span className="text-siokiu-smoke">{r.pace || '自由'}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
