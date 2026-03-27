import { useEventStore } from '../stores/eventStore'
import { useAds } from '../hooks/useAds'
import WallFilters from '../components/wall/WallFilters'
import CorkBoard from '../components/wall/CorkBoard'

export default function WallPage() {
  const { 篩選區域, 排序, 設定篩選區域, 設定排序, 取得篩選後活動, 取得歷史活動 } = useEventStore()
  const 活動列表 = 取得篩選後活動()
  const 歷史數量 = 取得歷史活動().length
  const { 廣告列表 } = useAds()

  return (
    <div className="min-h-svh bg-cork">
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
      />
    </div>
  )
}
