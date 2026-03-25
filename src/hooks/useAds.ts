import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import type { AdPlacement } from '../types'

/**
 * 從 Supabase 抓取廣告，合併兩張表，過濾掉沒圖片的，隨機排序
 */
export function useAds() {
  const [廣告列表, set廣告列表] = useState<AdPlacement[]>([])
  const [載入中, set載入中] = useState(true)

  useEffect(() => {
    let 已取消 = false

    async function 抓取廣告() {
      const 欄位 = 'id, brand_name, product_name, product_url, placement_text, image_url, priority, is_active'

      const [內部, 外部] = await Promise.all([
        supabase
          .from('tcuad_internal_placements')
          .select(欄位)
          .eq('is_active', true)
          .not('image_url', 'is', null),
        supabase
          .from('tcuad_placements')
          .select(欄位)
          .eq('is_active', true)
          .not('image_url', 'is', null),
      ])

      if (已取消) return

      const 全部 = [...(內部.data ?? []), ...(外部.data ?? [])] as AdPlacement[]

      // 隨機洗牌
      for (let i = 全部.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[全部[i], 全部[j]] = [全部[j], 全部[i]]
      }

      set廣告列表(全部)
      set載入中(false)
    }

    抓取廣告()
    return () => { 已取消 = true }
  }, [])

  return { 廣告列表, 載入中 }
}
