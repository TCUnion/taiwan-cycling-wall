import { useEffect } from 'react'
import { 淨化純文字 } from '../utils/sanitize'

const 預設標題 = '相揪約騎公布欄 — 單車約騎社群平台'
const 預設Canonical = 'https://siokiu.criterium.tw/'

/** 設定頁面 title、meta description、canonical 與 hreflang，離開時恢復預設值。輸入會淨化 HTML 標籤。 */
export function usePageMeta(title: string, description?: string, canonical?: string) {
  useEffect(() => {
    // 淨化：移除所有 HTML 標籤，防止注入
    document.title = 淨化純文字(title)

    const metaDesc = document.querySelector('meta[name="description"]')
    const 原始描述 = metaDesc?.getAttribute('content') ?? ''
    if (description) {
      metaDesc?.setAttribute('content', 淨化純文字(description))
    }

    // canonical
    const canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    const 原始Canonical = canonicalLink?.getAttribute('href') ?? 預設Canonical
    if (canonical && canonicalLink) {
      canonicalLink.setAttribute('href', canonical)
    }

    // hreflang — 頁面有 canonical 時，同步更新 hreflang 指向當前頁面 URL
    const hreflangLinks = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')
    )
    const 原始Hreflang = hreflangLinks.map(el => ({ el, href: el.getAttribute('href') ?? '' }))
    if (canonical) {
      hreflangLinks.forEach(el => el.setAttribute('href', canonical))
    }

    return () => {
      document.title = 預設標題
      if (description) metaDesc?.setAttribute('content', 原始描述)
      if (canonical && canonicalLink) canonicalLink.setAttribute('href', 原始Canonical)
      原始Hreflang.forEach(({ el, href }) => el.setAttribute('href', href))
    }
  }, [title, description, canonical])
}
