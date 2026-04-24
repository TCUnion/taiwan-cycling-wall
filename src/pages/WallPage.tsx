import { useEffect, useState } from 'react'
import type { CyclingEvent } from '../types'
import { useEventStore } from '../stores/eventStore'
import { useAds } from '../hooks/useAds'
import { usePageMeta } from '../hooks/usePageMeta'
import WallFilters from '../components/wall/WallFilters'
import CorkBoard from '../components/wall/CorkBoard'
import RideDetailDrawer from '../components/wall/RideDetailDrawer'

export default function WallPage() {
  const { 篩選區域, 排序, 載入中, 已載入, 設定篩選區域, 設定排序, 取得篩選後活動, 取得歷史活動, 載入活動 } = useEventStore()
  const 活動列表 = 取得篩選後活動()
  const 歷史數量 = 取得歷史活動().length
  const { 廣告列表 } = useAds()
  const [選取活動, set選取活動] = useState<CyclingEvent | null>(null)

  usePageMeta('相揪約騎公布欄 — 找人一起騎車', '瀏覽全台北中南東約騎活動，加入車友團騎，一起探索台灣最美自行車路線。', 'https://siokiu.criterium.tw/wall')

  useEffect(() => {
    載入活動()
  }, [載入活動])

  return (
    <div className="min-h-svh bg-cork text-siokiu-ink">
      <WallFilters
        篩選區域={篩選區域}
        排序={排序}
        onChange區域={設定篩選區域}
        onChange排序={設定排序}
        歷史數量={歷史數量}
      />
      <CorkBoard
        活動列表={活動列表}
        廣告列表={廣告列表}
        當前區域={篩選區域}
        onChange區域={設定篩選區域}
        onOpenActivity={set選取活動}
        載入中={載入中 || !已載入}
      />
      <RideDetailDrawer 活動={選取活動} onClose={() => set選取活動(null)} />
    </div>
  )
}
