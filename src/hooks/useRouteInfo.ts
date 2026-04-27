// 詳情頁 / drawer 顯示時的 fallback：如果活動 distance / elevation == 0 但有 Strava URL，
// 現場打 /api/route-info 拿來顯示（不寫回 DB）。

import { useEffect, useState } from 'react'

interface RouteInfo {
  distance?: number
  elevation?: number
  errorCode?: string
}

const cache = new Map<string, RouteInfo>()

export function useRouteInfo(url: string | undefined, enabled: boolean) {
  const [info, setInfo] = useState<RouteInfo | null>(() => (url ? cache.get(url) ?? null : null))

  useEffect(() => {
    if (!enabled || !url) return
    if (cache.has(url)) {
      setInfo(cache.get(url) ?? null)
      return
    }
    const isStrava = /strava\.com\/routes\/\d+/.test(url)
    const isRwgps = /ridewithgps\.com\/routes\/\d+/.test(url)
    if (!isStrava && !isRwgps) return

    const ctrl = new AbortController()
    fetch(`/api/route-info?url=${encodeURIComponent(url)}`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: RouteInfo) => {
        cache.set(url, d)
        setInfo(d)
      })
      .catch(() => undefined)

    return () => ctrl.abort()
  }, [url, enabled])

  return info
}
