import { useEffect } from 'react'

const 預設標題 = '約騎公布欄 — 單車約騎社群平台'

/** 設定頁面 title 和 meta description，離開時恢復預設值 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title

    if (description) {
      const meta = document.querySelector('meta[name="description"]')
      const 原始描述 = meta?.getAttribute('content') ?? ''
      meta?.setAttribute('content', description)
      return () => {
        document.title = 預設標題
        meta?.setAttribute('content', 原始描述)
      }
    }

    return () => { document.title = 預設標題 }
  }, [title, description])
}
