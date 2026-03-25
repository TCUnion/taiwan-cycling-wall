import { useMemo } from 'react'
import type { CyclingEvent, Region, AdPlacement } from '../../types'
import StickyNoteCard from './StickyNoteCard'
import AdCard from './AdCard'
import { useSwipeGesture } from '../../hooks/useSwipeGesture'

const 區域順序: (Region | null)[] = [null, '北部', '中部', '南部', '東部']

// 每幾個活動插入一則廣告
const 廣告間隔 = 5

interface Props {
  活動列表: CyclingEvent[]
  廣告列表: AdPlacement[]
  當前區域: Region | null
  onChange區域: (region: Region | null) => void
}

export default function CorkBoard({ 活動列表, 廣告列表, 當前區域, onChange區域 }: Props) {
  // 滑動切換區域
  const swipeRef = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: () => {
      const idx = 區域順序.indexOf(當前區域)
      if (idx < 區域順序.length - 1) onChange區域(區域順序[idx + 1])
    },
    onSwipeRight: () => {
      const idx = 區域順序.indexOf(當前區域)
      if (idx > 0) onChange區域(區域順序[idx - 1])
    },
  })

  // 將廣告穿插在活動列表中：每 5 個活動後插入 1 則廣告（循環使用）
  const 混合列表 = useMemo(() => {
    if (廣告列表.length === 0) {
      return 活動列表.map(活動 => ({ type: 'event' as const, data: 活動 }))
    }

    const 結果: ({ type: 'event'; data: CyclingEvent } | { type: 'ad'; data: AdPlacement })[] = []
    let 廣告索引 = 0

    活動列表.forEach((活動, i) => {
      結果.push({ type: 'event', data: 活動 })

      // 每 5 個活動後插入一則廣告
      if ((i + 1) % 廣告間隔 === 0) {
        結果.push({ type: 'ad', data: 廣告列表[廣告索引 % 廣告列表.length] })
        廣告索引++
      }
    })

    // 確保至少有一則廣告（活動不足 5 個時，在最後補一則）
    if (廣告索引 === 0 && 廣告列表.length > 0) {
      結果.push({ type: 'ad', data: 廣告列表[0] })
    }

    return 結果
  }, [活動列表, 廣告列表])

  if (活動列表.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-lg font-medium">目前沒有活動</p>
        <p className="text-sm mt-1">成為第一個發起約騎的人吧！</p>
      </div>
    )
  }

  return (
    <div ref={swipeRef} className="px-4 pb-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {混合列表.map((項目, i) =>
          項目.type === 'event' ? (
            <StickyNoteCard key={項目.data.id} 活動={項目.data} />
          ) : (
            <AdCard key={`ad-${i}`} 廣告={項目.data} />
          )
        )}
      </div>
    </div>
  )
}
