import { format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'

// 格式化日期 — 例如「4月5日（六）」
export function 格式化日期(dateStr: string): string {
  const date = parseISO(dateStr)
  return format(date, 'M月d日（EEEEE）', { locale: zhTW })
}

// 格式化完整日期 — 例如「2026年4月5日 星期六」
export function 格式化完整日期(dateStr: string): string {
  const date = parseISO(dateStr)
  return format(date, 'yyyy年M月d日 EEEE', { locale: zhTW })
}

// 格式化距離 — 例如「45 km」
export function 格式化距離(km: number): string {
  return `${km} km`
}

// 格式化爬升 — 例如「800 m」
export function 格式化爬升(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)}k m`
  return `${m} m`
}

// 產生唯一 ID
export function 產生ID(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
