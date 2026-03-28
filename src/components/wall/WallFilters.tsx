import { useNavigate } from 'react-router-dom'
import type { Region } from '../../types'
import { ArrowUpDown, History, Bike, Circle } from 'lucide-react'

type 排序方式 = '最新' | '最熱門'

interface Props {
  篩選區域: Region | null
  排序: 排序方式
  onChange區域: (region: Region | null) => void
  onChange排序: (sort: 排序方式) => void
  歷史數量: number
}

const 區域選項: { label: string; value: Region | null; dotColor: string; color: string; activeColor: string }[] = [
  { label: '全部', value: null, dotColor: '', color: 'text-gray-700', activeColor: 'bg-gray-700 text-white' },
  { label: '北部', value: '北部', dotColor: 'text-region-north', color: 'text-region-north', activeColor: 'bg-region-north text-white' },
  { label: '中部', value: '中部', dotColor: 'text-region-central', color: 'text-region-central', activeColor: 'bg-region-central text-white' },
  { label: '南部', value: '南部', dotColor: 'text-region-south', color: 'text-region-south', activeColor: 'bg-region-south text-white' },
  { label: '東部', value: '東部', dotColor: 'text-region-east', color: 'text-region-east', activeColor: 'bg-region-east text-white' },
]

export default function WallFilters({ 篩選區域, 排序, onChange區域, onChange排序, 歷史數量 }: Props) {
  const navigate = useNavigate()

  return (
    <div className="sticky top-0 z-30 bg-cork/95 backdrop-blur-sm pb-2">
      {/* 標題列 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-1.5"><Bike size={22} className="text-strava" />約騎公布欄</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/history')}
            aria-label="歷史活動"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
          >
            <History size={14} />
            歷史 {歷史數量} 則活動
          </button>
        </div>
      </div>

      {/* 區域篩選 */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {區域選項.map(({ label, value, dotColor, activeColor }) => {
          const 啟用 = 篩選區域 === value
          return (
            <button
              key={label}
              onClick={() => onChange區域(value)}
              aria-label={`篩選${label}地區`}
              className={`shrink-0 rounded-full px-3 py-2 min-h-[44px] text-sm font-medium cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-strava/40 focus-visible:outline-none flex items-center gap-1.5 ${
                啟用 ? activeColor : `bg-white/70 hover:bg-white`
              }`}
            >
              {dotColor && <Circle size={10} fill="currentColor" className={啟用 ? '' : dotColor} />}
              {label}
            </button>
          )
        })}

        {/* 排序切換 */}
        <button
          onClick={() => onChange排序(排序 === '最新' ? '最熱門' : '最新')}
          aria-label={`排序方式：${排序}`}
          className="ml-auto shrink-0 flex items-center gap-1 rounded-full bg-white/70 px-3 py-2 min-h-[44px] text-sm text-gray-600 hover:bg-white cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-strava/40 focus-visible:outline-none"
        >
          <ArrowUpDown size={14} />
          {排序}
        </button>
      </div>
    </div>
  )
}
