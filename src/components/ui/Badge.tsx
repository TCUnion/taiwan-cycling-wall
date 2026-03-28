import type { Region } from '../../types'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'region'
  region?: Region
  className?: string
}

// 區域對應的徽章樣式
const 區域樣式: Record<Region, string> = {
  '北部': 'bg-region-north/20 text-region-north border border-region-north/30',
  '中部': 'bg-region-central/20 text-region-central border border-region-central/30',
  '南部': 'bg-region-south/20 text-region-south border border-region-south/30',
  '東部': 'bg-region-east/20 text-region-east border border-region-east/30',
}

// 通用徽章元件，可依區域顯示不同顏色
export default function Badge({ children, variant = 'default', region, className = '' }: BadgeProps) {
  const 樣式 = variant === 'region' && region
    ? 區域樣式[region]
    : 'bg-gray-100 text-gray-700'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${樣式} ${className}`}>
      {children}
    </span>
  )
}
