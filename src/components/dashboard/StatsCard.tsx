// 統計概覽卡片元件 — 顯示單一指標（圖標、數值、標籤）

interface Props {
  icon: string
  label: string
  value: string | number
  unit?: string
}

export default function StatsCard({ icon, label, value, unit }: Props) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-800">
        {value}
        {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
