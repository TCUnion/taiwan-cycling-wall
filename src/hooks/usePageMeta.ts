import { useEffect } from 'react'
import { 淨化純文字 } from '../utils/sanitize'

const 預設標題 = '相揪約騎公布欄 — 單車約騎社群平台'

/** 設定頁面 title 和 meta description，離開時恢復預設值。輸入會淨化 HTML 標籤。 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    // 淨化：移除所有 HTML 標籤，防止注入
    document.title = 淨化純文字(title)

    if (description) {
      const meta = document.querySelector('meta[name="description"]')
      const 原始描述 = meta?.getAttribute('content') ?? ''
      meta?.setAttribute('content', 淨化純文字(description))
      return () => {
        document.title = 預設標題
        meta?.setAttribute('content', 原始描述)
      }
    }

    return () => { document.title = 預設標題 }
  }, [title, description])
}
