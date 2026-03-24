import type { CyclingEvent, Region } from '../../types'
import StickyNoteCard from './StickyNoteCard'
import { useSwipeGesture } from '../../hooks/useSwipeGesture'

const 區域順序: (Region | null)[] = [null, '北部', '中部', '南部', '東部']

interface Props {
  活動列表: CyclingEvent[]
  當前區域: Region | null
  onChange區域: (region: Region | null) => void
}

export default function CorkBoard({ 活動列表, 當前區域, onChange區域 }: Props) {
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
        {活動列表.map(活動 => (
          <StickyNoteCard key={活動.id} 活動={活動} />
        ))}
      </div>
    </div>
  )
}
