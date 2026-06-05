import { useEffect, useMemo, useState } from 'react'
import { Bike, MapPin, Loader2, Compass } from 'lucide-react'
import { 縣市列表 } from '../data/counties'
import { useRegionStore } from '../stores/regionStore'
import { 取得自行車道, 取得觀光景點, type 自行車道, type 觀光景點 } from '../utils/tdxService'
import ExploreMap from '../components/explore/ExploreMap'

export default function ExplorePage() {
  const 選擇的縣市 = useRegionStore((s) => s.選擇的縣市)
  // 預設縣市：跟隨區域選擇，否則台中（資料較完整）
  const [縣市id, set縣市id] = useState<string>(選擇的縣市 ?? 'taichung')
  const [顯示車道, set顯示車道] = useState(true)
  const [顯示景點, set顯示景點] = useState(true)

  const [車道, set車道] = useState<自行車道[]>([])
  const [景點, set景點] = useState<觀光景點[]>([])
  const [載入中, set載入中] = useState(false)
  const [錯誤, set錯誤] = useState<string | null>(null)

  const 中心 = useMemo<[number, number]>(() => {
    const c = 縣市列表.find((x) => x.id === 縣市id)
    return c ? [c.lat, c.lng] : [23.5, 121]
  }, [縣市id])

  useEffect(() => {
    let active = true
    const 載入 = async () => {
      set載入中(true)
      set錯誤(null)
      try {
        const [道, 點] = await Promise.all([取得自行車道(縣市id), 取得觀光景點(縣市id)])
        if (!active) return
        set車道(道)
        set景點(點)
      } catch (err) {
        if (active) set錯誤((err as Error).message)
      } finally {
        if (active) set載入中(false)
      }
    }
    載入()
    return () => {
      active = false
    }
  }, [縣市id])

  return (
    <div className="min-h-svh bg-cork pb-8">
      {/* 頁首 */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Compass size={20} className="text-strava" />
          探索
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">各縣市自行車道與觀光景點（資料來源：TDX 運輸資料流通服務）</p>
      </div>

      {/* 控制列 */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
        <select
          name="explore-county"
          value={縣市id}
          onChange={(e) => set縣市id(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-strava/40 focus-visible:outline-none"
        >
          {縣市列表.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => set顯示車道((v) => !v)}
          aria-pressed={顯示車道}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium cursor-pointer transition-colors ${
            顯示車道 ? 'border-line bg-line/10 text-line' : 'border-gray-300 bg-white text-gray-400'
          }`}
        >
          <Bike size={15} />
          自行車道
        </button>

        <button
          type="button"
          onClick={() => set顯示景點((v) => !v)}
          aria-pressed={顯示景點}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium cursor-pointer transition-colors ${
            顯示景點 ? 'border-strava bg-strava/10 text-strava' : 'border-gray-300 bg-white text-gray-400'
          }`}
        >
          <MapPin size={15} />
          觀光景點
        </button>
      </div>

      {/* 地圖 */}
      <div className="px-4">
        {錯誤 ? (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-red-500">
            載入失敗：{錯誤}
          </div>
        ) : (
          <div className="relative">
            <ExploreMap
              自行車道={顯示車道 ? 車道 : []}
              景點={顯示景點 ? 景點 : []}
              中心={中心}
            />
            {載入中 && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center rounded-xl bg-white/60">
                <Loader2 size={28} className="animate-spin text-strava" />
              </div>
            )}
          </div>
        )}

        {/* 統計 */}
        {!錯誤 && !載入中 && (
          <div className="mt-3 flex gap-4 px-1 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Bike size={13} className="text-line" />
              {車道.length} 條車道
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-strava" />
              {景點.length} 個景點
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
