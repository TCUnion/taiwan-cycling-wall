import { useState, useMemo } from 'react'
import { Loader2, Inbox } from 'lucide-react'
import type { CyclingEvent, Region } from '../../types'
import { 查找縣市 } from '../../data/counties'
import { 解析日期, REGION_INK } from './wallShared'
import EventWeatherInline from '../event/EventWeatherInline'

interface Props {
  活動列表: CyclingEvent[]
  當前區域: Region | null
  onChange區域: (region: Region | null) => void
  onOpenActivity: (活動: CyclingEvent) => void
  載入中?: boolean
}

// 縣市在 SVG viewBox(120x110) 上的近似位置（取自設計稿，非地理座標）
const 縣市位置: Record<string, [number, number]> = {
  '台北市': [73, 22], '新北市': [69, 24], '基隆市': [72, 18],
  '桃園市': [63, 30], '新竹縣': [58, 36], '新竹市': [56, 37],
  '苗栗縣': [53, 42], '台中市': [48, 50], '彰化縣': [45, 56],
  '南投縣': [53, 55], '雲林縣': [43, 62], '嘉義縣': [42, 68],
  '嘉義市': [43, 67], '台南市': [40, 76], '高雄市': [43, 83],
  '屏東縣': [48, 90], '宜蘭縣': [74, 34], '花蓮縣': [72, 55],
  '台東縣': [64, 77], '澎湖縣': [22, 70], '金門縣': [10, 60],
  '連江縣': [12, 12],
}

// 台灣地圖 SVG
function 台灣SVG({
  活動列表, 當前區域, onChange區域, 選中Id, onSelect,
}: {
  活動列表: CyclingEvent[]
  當前區域: Region | null
  onChange區域: (region: Region | null) => void
  選中Id: string | undefined
  onSelect: (活動: CyclingEvent) => void
}) {
  return (
    <svg viewBox="0 0 120 110" className="block h-auto w-full">
      {/* 台灣本島粗略輪廓 */}
      <path
        d="M 62 8 Q 72 8 78 18 Q 84 28 78 44 Q 82 58 74 74 Q 66 92 50 100 Q 40 104 34 96 Q 30 84 36 72 Q 40 58 44 46 Q 46 32 52 22 Q 56 10 62 8 Z"
        fill="var(--siokiu-paper)"
        stroke="var(--siokiu-ink)"
        strokeWidth="0.4"
      />
      {/* 澎湖示意 */}
      <circle cx="20" cy="70" r="1.2" fill="var(--siokiu-ink)" opacity="0.4" />
      <circle cx="24" cy="73" r="0.8" fill="var(--siokiu-ink)" opacity="0.3" />

      {/* 緯線虛線 */}
      {[20, 40, 60, 80].map(y => (
        <line
          key={y}
          x1="8" y1={y} x2="112" y2={y}
          stroke="var(--siokiu-border)" strokeWidth="0.2"
          strokeDasharray="0.5 1.5" opacity="0.6"
        />
      ))}

      {/* 活動 pin */}
      {活動列表.map(r => {
        const 縣市 = 查找縣市(r.countyId)
        const p = 縣市位置[縣市?.name ?? ''] ?? [60, 50]
        const sel = 選中Id === r.id
        const dim = 當前區域 && 當前區域 !== r.region
        return (
          <g
            key={r.id}
            style={{ cursor: 'pointer', opacity: dim ? 0.25 : 1 }}
            onClick={() => onSelect(r)}
          >
            <circle
              cx={p[0]} cy={p[1]} r={sel ? 3.5 : 2.2}
              fill={REGION_INK[r.region]}
              stroke="var(--siokiu-paper)" strokeWidth="0.5"
            />
            {sel && (
              <circle
                cx={p[0]} cy={p[1]} r="5"
                fill="none" stroke={REGION_INK[r.region]}
                strokeWidth="0.4" opacity="0.5"
              />
            )}
          </g>
        )
      })}

      {/* 區域名標籤（可點擊切換篩選） */}
      {(['北部', '中部', '南部', '東部'] as Region[]).map(reg => {
        const pos: Record<Region, [number, number]> = {
          '北部': [76, 16], '中部': [54, 48], '南部': [40, 80], '東部': [74, 62],
        }
        const [x, y] = pos[reg]
        return (
          <text
            key={reg}
            x={x} y={y}
            fontFamily="var(--font-serif)"
            fontSize="3.5"
            fontWeight="900"
            fill="var(--siokiu-ink)"
            opacity={!當前區域 || 當前區域 === reg ? 1 : 0.3}
            style={{ cursor: 'pointer' }}
            onClick={() => onChange區域(當前區域 === reg ? null : reg)}
          >
            {reg.charAt(0)}
          </text>
        )
      })}
    </svg>
  )
}

export default function WallAtlas({
  活動列表, 當前區域, onChange區域, onOpenActivity, 載入中 = false,
}: Props) {
  const [選中, set選中] = useState<CyclingEvent | null>(null)
  const 排序後 = useMemo(
    () => [...活動列表].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [活動列表]
  )
  const 顯示中 = 選中 && 活動列表.some(r => r.id === 選中.id) ? 選中 : 排序後[0]

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
        <p className="font-serif text-2xl font-black">島上目前沒有約騎</p>
        <p className="mt-1 text-sm text-siokiu-smoke">成為第一個發起約騎的人吧！</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100svh-112px)] bg-siokiu-paper pb-24 text-siokiu-ink">
      {/* 報頭 */}
      <div className="border-b border-siokiu-border px-5 pt-3.5 pb-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.3em] text-siokiu-smoke whitespace-nowrap">
            ATLAS · 台灣
          </span>
          <span className="font-mono text-[10px] text-siokiu-smoke whitespace-nowrap">
            {活動列表.length} · {當前區域 ?? '全區'}
          </span>
        </div>
      </div>

      {/* 地圖 */}
      <div className="px-8 pt-2">
        <台灣SVG
          活動列表={活動列表}
          當前區域={當前區域}
          onChange區域={onChange區域}
          選中Id={顯示中?.id}
          onSelect={set選中}
        />
      </div>

      {/* 選中活動卡 */}
      {顯示中 && (() => {
        const 縣市 = 查找縣市(顯示中.countyId)
        const ink = REGION_INK[顯示中.region]
        const d = 解析日期(顯示中.date)
        return (
          <div className="relative mx-5 mb-3.5 border border-siokiu-ink bg-siokiu-paper p-3.5">
            <div
              className="absolute -left-px -top-px h-[calc(100%+2px)] w-1"
              style={{ background: ink }}
            />
            <span
              className="text-[9px] font-medium uppercase tracking-[0.25em]"
              style={{ color: ink }}
            >
              {顯示中.region} · {縣市?.name ?? '台灣'}
            </span>
            <button
              onClick={() => onOpenActivity(顯示中)}
              className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
            >
              <div className="mb-2 mt-1 line-clamp-2 font-serif text-[1.3rem] font-black leading-[1.1] tracking-tight text-siokiu-ink">
                {顯示中.title}
              </div>
            </button>
            <div className="mb-2.5 text-[11.5px] leading-[1.5] text-siokiu-smoke">
              {顯示中.meetingPoint || 縣市?.name || '集合地點待公布'} · {d?.short ?? 顯示中.date} 週{d?.W ?? '-'} · {顯示中.time}
            </div>
            <div className="flex items-center gap-3.5 font-mono text-[12px] text-siokiu-ink">
              <span>
                {顯示中.distance > 0 ? 顯示中.distance : '-'}
                <span className="ml-px text-[9px] text-siokiu-smoke">km</span>
              </span>
              <span>
                ↑{顯示中.elevation > 0 ? 顯示中.elevation : '-'}
                <span className="ml-px text-[9px] text-siokiu-smoke">m</span>
              </span>
              <span className="text-siokiu-smoke">{顯示中.pace || '自由'}</span>
              <span className="flex-1" />
              <button
                onClick={() => onOpenActivity(顯示中)}
                className="cursor-pointer border-0 bg-siokiu-red px-2.5 py-1 font-sans text-[11px] font-medium tracking-[0.1em] text-siokiu-paper transition-opacity hover:opacity-90"
              >
                查看 →
              </button>
            </div>
            <div className="mt-2">
              <EventWeatherInline 活動={顯示中} />
            </div>
          </div>
        )
      })()}

      {/* 索引列表 */}
      <div className="px-5">
        <div className="block border-t border-siokiu-border px-0 py-2.5 text-[9px] font-medium uppercase tracking-[0.25em] text-siokiu-smoke">
          INDEX · 全部約騎
        </div>
        {排序後.map((r, i) => {
          const 縣市 = 查找縣市(r.countyId)
          const ink = REGION_INK[r.region]
          const d = 解析日期(r.date)
          const sel = 顯示中?.id === r.id
          return (
            <div
              key={r.id}
              onClick={() => set選中(r)}
              className={`flex cursor-pointer items-center gap-2.5 py-2.5 ${
                i < 排序後.length - 1 ? 'border-b border-siokiu-border' : ''
              } ${sel ? 'bg-siokiu-ink/[0.05]' : 'bg-transparent'}`}
            >
              <span className="w-5 font-mono text-[10px] text-siokiu-smoke">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className="inline-block h-[6px] w-[6px] shrink-0 rounded-full"
                style={{ background: ink }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-serif text-[14px] font-bold leading-tight text-siokiu-ink">
                  {r.title}
                </div>
                <div className="mt-0.5 text-[10px] text-siokiu-smoke">
                  {縣市?.name ?? r.region} · {d?.short ?? r.date}
                </div>
              </div>
              <span className="whitespace-nowrap font-mono text-[10px] text-siokiu-ink">
                {r.distance > 0 ? `${r.distance}k` : '-'} ↑{r.elevation > 0 ? r.elevation : '-'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
