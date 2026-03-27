import { useNavigate } from 'react-router-dom'
import type { Region } from '../../types'
import { ArrowUpDown, History } from 'lucide-react'

type 排序方式 = '最新' | '最熱門'

interface Props {
  篩選區域: Region | null
  排序: 排序方式
  onChange區域: (region: Region | null) => void
  onChange排序: (sort: 排序方式) => void
  歷史數量: number
}

const 區域選項: { label: string; value: Region | null; color: string; activeColor: string }[] = [
  { label: '全部', value: null, color: 'text-gray-700', activeColor: 'bg-gray-700 text-white' },
  { label: '🔵 北部', value: '北部', color: 'text-region-north', activeColor: 'bg-region-north text-white' },
  { label: '🟠 中部', value: '中部', color: 'text-region-central', activeColor: 'bg-region-central text-white' },
  { label: '🔴 南部', value: '南部', color: 'text-region-south', activeColor: 'bg-region-south text-white' },
  { label: '🟢 東部', value: '東部', color: 'text-region-east', activeColor: 'bg-region-east text-white' },
]

export default function WallFilters({ 篩選區域, 排序, onChange區域, onChange排序, 歷史數量 }: Props) {
  const navigate = useNavigate()

  return (
    <div className="sticky top-0 z-30 bg-cork/95 backdrop-blur-sm pb-2">
      {/* 標題列 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gray-800">🚴 約騎公布欄</h1>
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
        {區域選項.map(({ label, value, color, activeColor }) => {
          const 啟用 = 篩選區域 === value
          return (
            <button
              key={label}
              onClick={() => onChange區域(value)}
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-all ${
                啟用 ? activeColor : `bg-white/70 ${color} hover:bg-white`
              }`}
            >
              {label}
            </button>
          )
        })}

        {/* 排序切換 */}
        <button
          onClick={() => onChange排序(排序 === '最新' ? '最熱門' : '最新')}
          className="ml-auto shrink-0 flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-sm text-gray-600 hover:bg-white transition-colors"
        >
          <ArrowUpDown size={14} />
          {排序}
        </button>
      </div>
    </div>
  )
}
