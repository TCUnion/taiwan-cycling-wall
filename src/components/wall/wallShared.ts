// 公布欄版型共用工具：日期格式化、區域色、發起人查找
import type { CyclingEvent, Region } from '../../types'
import type { User } from '../../types'

// 區域 ink 色（深色版，搭配 paper 背景）
export const REGION_INK: Record<Region, string> = {
  '北部': '#0A3C6E',
  '中部': '#C94B0A',
  '南部': '#8B1A1A',
  '東部': '#1A6B3C',
}

export interface DateBits {
  M: number
  D: number
  W: string
  short: string
  full: string
}

export function 解析日期(iso: string): DateBits | null {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  const M = d.getMonth() + 1
  const D = d.getDate()
  const W = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return {
    M,
    D,
    W,
    short: `${M}/${D}`,
    full: `${M}月${D}日 週${W}`,
  }
}

// 從活動取得發起人顯示名稱與認證狀態
export function 解析發起人(活動: CyclingEvent, 所有使用者: User[]) {
  const 是粉絲頁 = 活動.creatorId.startsWith('page-')
  if (是粉絲頁) {
    const pageId = 活動.creatorId.replace('page-', '')
    const owner = 所有使用者.find(u => u.managedPages?.some(p => p.pageId === pageId))
    const page = owner?.managedPages?.find(p => p.pageId === pageId)
    return {
      名稱: page?.name ?? '粉絲頁',
      頭像: page?.pictureUrl,
      verified: !!owner?.verifiedAt,
      是粉絲頁: true,
    }
  }
  const owner = 所有使用者.find(u => u.id === 活動.creatorId)
  return {
    名稱: owner?.name ?? '匿名',
    頭像: owner?.avatar,
    verified: !!owner?.verifiedAt,
    是粉絲頁: false,
  }
}

// 取得活動圖章（優先用 coverImage，再找發起人 stamp）
export function 取得圖章(活動: CyclingEvent, 所有使用者: User[]): string | undefined {
  if (活動.coverImage) return 活動.coverImage
  const owner = 所有使用者.find(u => u.id === 活動.creatorId)
  return owner?.stampImages?.[0] || owner?.stampImage
}
