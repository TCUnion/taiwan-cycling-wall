/**
 * Cloudflare Pages Function — 從 Strava / Ride with GPS 抓取路線距離與爬升
 * GET /api/route-info?url=https://www.strava.com/routes/123
 *
 * 解析來源：Strava 官方 embed 端點 strava-embeds.com/route/{id}（SSR，HTML 直接含資料）。
 * www.strava.com/routes/{id} 是 SPA 不含資料；不要打那個。
 * 私人路線會被擋（404 或 stat block 不存在），回傳 errorCode 引導手動輸入。
 */

interface RouteInfo {
  title?: string
  distance?: number  // 公里
  elevation?: number // 公尺
  source: 'strava' | 'ridewithgps' | 'unknown'
  // 解析失敗時的明確錯誤碼，前端可顯示對應提示
  errorCode?: 'strava_no_ssr_data' | 'private_or_not_found' | 'parser_failed' | 'network_failed' | 'unsupported_platform'
  message?: string
}

const ALLOWED_ORIGIN = 'https://siokiu.criterium.tw'

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return Response.json({ error: '缺少 url 參數' }, { status: 400 })
  }

  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Cache-Control': 'public, max-age=600',
  }

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

  return Response.json({
    source: 'unknown',
    errorCode: 'unsupported_platform',
    message: '目前僅支援 Strava 與 Ride with GPS 路線連結',
  } satisfies RouteInfo, { headers })
}

/**
 * 從 Strava 取得路線資訊。
 * 注意：`www.strava.com/routes/{id}` 是 SPA，client-side 載入；但 Strava 官方 embed
 * 端點 `strava-embeds.com/route/{id}` 是 SSR，HTML 直接含 distance / elevation_gain。
 * 因此本函式直接打 embed 端點解析。
 */
async function fetchStravaRoute(routeId: string): Promise<RouteInfo> {
  let html: string
  let units: 'metric' | 'imperial' = 'metric'
  try {
    const res = await fetch(`https://strava-embeds.com/route/${routeId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; siokiu/1.0)' },
    })
    if (res.status === 404) {
      return { source: 'strava', errorCode: 'private_or_not_found', message: '路線不存在或為私人路線' }
    }
    if (!res.ok) {
      return { source: 'strava', errorCode: 'network_failed', message: `Strava 回應 ${res.status}` }
    }
    html = await res.text()
    if (/data-units="imperial"/.test(html)) units = 'imperial'
  } catch (err) {
    return { source: 'strava', errorCode: 'network_failed', message: `連線失敗：${(err as Error).message}` }
  }

  // 1) 從可見的 stat block 解析（最可靠）
  //    <div class="stat-label">Distance</div><div class="stat-value">142.3 km</div>
  //    <div class="stat-label">Elev Gain</div><div class="stat-value">1,251 m</div>
  const distMatch = html.match(/stat-label">Distance<\/div><div class="stat-value">([\d.,]+)\s*(km|mi)/i)
  const elevMatch = html.match(/stat-label">Elev(?:ation)?\s*Gain<\/div><div class="stat-value">([\d.,]+)\s*(m|ft)/i)

  let distance: number | undefined
  let elevation: number | undefined

  if (distMatch) {
    const v = parseFloat(distMatch[1].replace(/,/g, ''))
    const u = (distMatch[2] || (units === 'imperial' ? 'mi' : 'km')).toLowerCase()
    distance = u === 'mi' ? Math.round(v * 1.609344 * 100) / 100 : Math.round(v * 100) / 100
  }
  if (elevMatch) {
    const v = parseFloat(elevMatch[1].replace(/,/g, ''))
    const u = (elevMatch[2] || (units === 'imperial' ? 'ft' : 'm')).toLowerCase()
    elevation = u === 'ft' ? Math.round(v * 0.3048) : Math.round(v)
  }

  // 2) 備援：從內嵌 JSON 找 route 終點 distance（公尺）
  if (!distance) {
    const m = html.match(/"category":"End"[^}]*"distance":([\d.]+)/)
    if (m) distance = Math.round(parseFloat(m[1]) / 10) / 100
  }

  if (distance || elevation) {
    return { source: 'strava', distance, elevation }
  }

  // 完全抓不到（路線私人或 embed 也擋）
  return {
    source: 'strava',
    errorCode: 'parser_failed',
    message: '無法從 Strava embed 解析距離/爬升（可能是私人路線），請手動填入',
  }
}

/** Ride with GPS 公開 JSON API 取得路線資訊 */
async function fetchRwgpsRoute(routeId: string): Promise<RouteInfo> {
  try {
    const res = await fetch(`https://ridewithgps.com/routes/${routeId}.json`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; siokiu/1.0)' },
    })
    if (res.status === 404) {
      return { source: 'ridewithgps', errorCode: 'private_or_not_found', message: '路線不存在或為私人路線' }
    }
    if (!res.ok) {
      return { source: 'ridewithgps', errorCode: 'network_failed', message: `Ride with GPS 回應 ${res.status}` }
    }
    const data = await res.json() as Record<string, unknown>
    const route = (data.route ?? data) as Record<string, unknown>

    const distanceM = Number(route.distance) || 0
    const elevationM = Number(route.elevation_gain) || 0

    if (!distanceM && !elevationM) {
      return { source: 'ridewithgps', errorCode: 'parser_failed', message: 'JSON 回應未含距離/爬升欄位' }
    }

    return {
      source: 'ridewithgps',
      title: (route.name as string) || undefined,
      distance: distanceM ? Math.round(distanceM / 10) / 100 : undefined,
      elevation: elevationM ? Math.round(elevationM) : undefined,
    }
  } catch (err) {
    return { source: 'ridewithgps', errorCode: 'network_failed', message: `連線失敗：${(err as Error).message}` }
  }
}
