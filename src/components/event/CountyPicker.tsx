import { MapPin } from 'lucide-react'
import type { Region } from '../../types'
import { 依區域分組 } from '../../data/counties'

interface Props {
  value: string
  onChange: (countyId: string) => void
}

const 區域列表: Region[] = ['北部', '中部', '南部', '東部']

const 區域色: Record<Region, string> = {
  '北部': 'border-region-north text-region-north',
  '中部': 'border-region-central text-region-central',
  '南部': 'border-region-south text-region-south',
  '東部': 'border-region-east text-region-east',
}

export default function CountyPicker({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><MapPin size={14} />選擇縣市</label>
      {區域列表.map(region => (
        <div key={region}>
          <p className="text-xs font-medium text-gray-500 mb-1">{region}</p>
          <div className="flex flex-wrap gap-1.5">
            {依區域分組(region).map(county => (
              <button
                key={county.id}
                type="button"
                onClick={() => onChange(county.id)}
                aria-label={`選擇${county.name}`}
                className={`rounded-full px-3 py-1.5 min-h-[36px] text-xs font-medium border cursor-pointer transition-all ${
                  value === county.id
                    ? `${區域色[region]} border-current bg-white`
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {county.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
