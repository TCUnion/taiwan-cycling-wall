import type { Region } from '../types'
import { 縣市列表 } from '../data/counties'

// 根據經緯度找最近的縣市
export function 找最近縣市(lat: number, lng: number): string {
  let 最近距離 = Infinity
  let 最近縣市Id = 'taipei'

  for (const county of 縣市列表) {
    const 距離 = Math.sqrt(
      Math.pow(county.lat - lat, 2) + Math.pow(county.lng - lng, 2)
    )
    if (距離 < 最近距離) {
      最近距離 = 距離
      最近縣市Id = county.id
    }
  }

  return 最近縣市Id
}

// 區域顏色 class 對照
export const 區域背景色: Record<Region, string> = {
  '北部': 'bg-region-north',
  '中部': 'bg-region-central',
  '南部': 'bg-region-south',
  '東部': 'bg-region-east',
}

export const 區域文字色: Record<Region, string> = {
  '北部': 'text-region-north',
  '中部': 'text-region-central',
  '南部': 'text-region-south',
  '東部': 'text-region-east',
}
