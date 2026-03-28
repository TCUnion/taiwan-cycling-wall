/**
 * Cloudflare Pages Function — 從 Strava / Ride with GPS 抓取路線距離與爬升
 * GET /api/route-info?url=https://www.strava.com/routes/123
 */

interface RouteInfo {
  title?: string
  distance?: number  // 公里
  elevation?: number // 公尺
  source: 'strava' | 'ridewithgps' | 'unknown'
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return Response.json({ error: '缺少 url 參數' }, { status: 400 })
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=3600', // 快取 1 小時
  }

  try {
    // Strava routes
    const stravaMatch = url.match(/strava\.com\/routes\/(\d+)/)
    if (stravaMatch) {
      const info = await fetchStravaRoute(stravaMatch[1])
      return Response.json(info, { headers })
    }

    // Ride with GPS routes
    const rwgpsMatch = url.match(/ridewithgps\.com\/routes\/(\d+)/)
    if (rwgpsMatch) {
      const info = await fetchRwgpsRoute(rwgpsMatch[1])
      return Response.json(info, { headers })
    }

    return Response.json({ error: '不支援的路線平台', source: 'unknown' }, { status: 400, headers })
  } catch (e) {
    return Response.json({ error: '抓取路線資訊失敗' }, { status: 500, headers })
  }
}

/** 從 Strava 路線頁面的 __NEXT_DATA__ 解析距離與爬升 */
async function fetchStravaRoute(routeId: string): Promise<RouteInfo> {
  const res = await fetch(`https://www.strava.com/routes/${routeId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; siokiu/1.0)' },
  })
  const html = await res.text()

  // 解析 __NEXT_DATA__ JSON
  const match = html.match(/__NEXT_DATA__.*?>(.*?)<\/script>/)
  if (!match) throw new Error('無法解析 Strava 頁面')

  const data = JSON.parse(match[1])
  const route = data?.props?.pageProps?.route ?? {}

  return {
    title: route.title || undefined,
    distance: route.length ? Math.round(route.length / 10) / 100 : undefined, // 公尺→公里（2位小數）
    elevation: route.elevationGain ? Math.round(route.elevationGain) : undefined,
    source: 'strava',
  }
}

/** 從 Ride with GPS 公開 JSON API 取得路線資訊 */
async function fetchRwgpsRoute(routeId: string): Promise<RouteInfo> {
  const res = await fetch(`https://ridewithgps.com/routes/${routeId}.json`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; siokiu/1.0)' },
  })
  const data = await res.json() as Record<string, unknown>
  const route = (data.route ?? data) as Record<string, unknown>

  const distanceM = Number(route.distance) || 0
  const elevationM = Number(route.elevation_gain) || 0

  return {
    title: (route.name as string) || undefined,
    distance: distanceM ? Math.round(distanceM / 10) / 100 : undefined,
    elevation: elevationM ? Math.round(elevationM) : undefined,
    source: 'ridewithgps',
  }
}
