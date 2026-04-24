import { useNavigate } from 'react-router-dom'
import type { Region } from '../../types'
import { ArrowDownUp, Archive, Circle } from 'lucide-react'

type 排序方式 = '最新' | '最熱門'

interface Props {
  篩選區域: Region | null
  排序: 排序方式
  onChange區域: (region: Region | null) => void
  onChange排序: (sort: 排序方式) => void
  歷史數量: number
}

const 區域選項: { label: string; value: Region | null; dotColor: string; activeColor: string }[] = [
  { label: '全部', value: null, dotColor: '', activeColor: 'bg-siokiu-ink text-siokiu-paper border-siokiu-ink' },
  { label: '北部', value: '北部', dotColor: 'text-region-north', activeColor: 'bg-region-north text-siokiu-paper border-region-north' },
  { label: '中部', value: '中部', dotColor: 'text-region-central', activeColor: 'bg-region-central text-siokiu-paper border-region-central' },
  { label: '南部', value: '南部', dotColor: 'text-region-south', activeColor: 'bg-region-south text-siokiu-paper border-region-south' },
  { label: '東部', value: '東部', dotColor: 'text-region-east', activeColor: 'bg-region-east text-siokiu-paper border-region-east' },
]

export default function WallFilters({ 篩選區域, 排序, onChange區域, onChange排序, 歷史數量 }: Props) {
  const navigate = useNavigate()

  return (
    <div className="sticky top-0 z-30 border-b border-siokiu-paper/15 bg-siokiu-ink/90 text-siokiu-paper backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="font-serif text-[1.45rem] font-black leading-none tracking-normal text-siokiu-paper">約騎</h1>
          <span className="truncate text-[0.58rem] uppercase tracking-[0.28em] text-siokiu-paper/70">
            SIOKIU · BULLETIN
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => navigate('/history')}
            aria-label="歷史活動"
            className="flex min-h-11 items-center gap-1.5 px-1 text-[0.68rem] tracking-[0.12em] text-siokiu-paper/70 transition-colors hover:text-siokiu-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siokiu-red/40 cursor-pointer"
          >
            <Archive size={14} />
            {歷史數量}
            <span className="hidden sm:inline">歷史</span>
          </button>
          <button
            onClick={() => onChange排序(排序 === '最新' ? '最熱門' : '最新')}
            aria-label={`排序方式：${排序}`}
            className="flex min-h-11 items-center gap-1.5 border border-siokiu-paper/15 px-2 text-[0.68rem] tracking-[0.16em] text-siokiu-paper transition-colors hover:border-siokiu-paper/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siokiu-red/40 cursor-pointer"
          >
            <ArrowDownUp size={13} />
            {排序}
          </button>
        </div>
      </div>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3">
        {區域選項.map(({ label, value, dotColor, activeColor }) => {
          const 啟用 = 篩選區域 === value
          return (
            <button
              key={label}
              onClick={() => onChange區域(value)}
              aria-label={`篩選${label}地區`}
              className={`flex min-h-11 shrink-0 items-center gap-1.5 border px-3 py-2 text-sm font-medium tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siokiu-red/40 cursor-pointer ${
                啟用 ? activeColor : 'border-siokiu-paper/15 bg-transparent text-siokiu-paper hover:border-siokiu-paper/35'
              }`}
            >
              {dotColor && <Circle size={7} fill="currentColor" className={啟用 ? 'text-siokiu-paper' : dotColor} />}
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
