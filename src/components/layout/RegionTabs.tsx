import type { Region } from '../../types'

interface RegionTabsProps {
  選擇的區域: Region | null
  onChange: (region: Region | null) => void
}

const 區域選項: { label: string; value: Region | null; color: string }[] = [
  { label: '全部', value: null, color: 'bg-gray-700 text-white' },
  { label: '北部', value: '北部', color: 'bg-region-north text-white' },
  { label: '中部', value: '中部', color: 'bg-region-central text-white' },
  { label: '南部', value: '南部', color: 'bg-region-south text-white' },
  { label: '東部', value: '東部', color: 'bg-region-east text-white' },
]

export default function RegionTabs({ 選擇的區域, onChange }: RegionTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
      {區域選項.map(({ label, value, color }) => {
        const 啟用 = 選擇的區域 === value
        return (
          <button
            key={label}
            onClick={() => onChange(value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              啟用 ? color : 'bg-white/70 text-gray-600 hover:bg-white'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
