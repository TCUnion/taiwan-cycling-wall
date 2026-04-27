import { useEffect, useRef, useState } from 'react'
import { LayoutGrid, Newspaper, CalendarDays, Map, Check } from 'lucide-react'
import { useWallLayoutStore, 版型選項, type WallLayout } from '../../stores/wallLayoutStore'

const ICONS: Record<WallLayout, typeof LayoutGrid> = {
  classic: LayoutGrid,
  newsprint: Newspaper,
  timeline: CalendarDays,
  atlas: Map,
}

// 公布欄版型切換器：右上角圖示按鈕，點擊展開選單
export default function WallLayoutSwitcher() {
  const { 版型, 設定版型 } = useWallLayoutStore()
  const [開啟, set開啟] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!開啟) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) set開啟(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [開啟])

  const Icon = ICONS[版型]
  const 當前 = 版型選項.find(v => v.value === 版型)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => set開啟(v => !v)}
        aria-label={`公布欄版型：${當前?.label ?? '預設'}`}
        aria-expanded={開啟}
        className="flex min-h-11 items-center gap-1.5 border border-siokiu-paper/15 px-2 text-[0.68rem] tracking-[0.16em] text-siokiu-paper transition-colors hover:border-siokiu-paper/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siokiu-red/40 cursor-pointer"
      >
        <Icon size={13} />
        <span className="hidden sm:inline">{當前?.label}</span>
        <span className="sm:hidden">版型</span>
      </button>

      {開啟 && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-48 border border-siokiu-ink/15 bg-siokiu-paper text-siokiu-ink shadow-[0_8px_24px_rgba(22,18,14,0.18)]"
        >
          {版型選項.map(opt => {
            const ItemIcon = ICONS[opt.value]
            const 啟用 = opt.value === 版型
            return (
              <button
                key={opt.value}
                role="menuitemradio"
                aria-checked={啟用}
                onClick={() => {
                  設定版型(opt.value)
                  set開啟(false)
                }}
                className={`flex w-full cursor-pointer items-center gap-2.5 border-b border-siokiu-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-siokiu-ink/[0.05] ${
                  啟用 ? 'bg-siokiu-ink/[0.04]' : ''
                }`}
              >
                <ItemIcon size={14} className="shrink-0 text-siokiu-smoke" />
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-sm font-black leading-none text-siokiu-ink">
                    {opt.label}
                  </div>
                  <div className="mt-1 text-[9px] uppercase tracking-[0.25em] text-siokiu-smoke">
                    {opt.eyebrow}
                  </div>
                </div>
                {啟用 && <Check size={14} className="shrink-0 text-siokiu-red" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
