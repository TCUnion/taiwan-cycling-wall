// 呼叫 OSRM demo server 取得自行車路線
// 文件：https://project-osrm.org/docs/v5.24.0/api/

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/cycling'

export interface OsrmResult {
  coordinates: [number, number][]  // [lat, lng][] 解碼後的折線座標
  distance: number                  // 公里
  duration: number                  // 分鐘
}

// Polyline 解碼（precision=5）
function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let b: number
    let shift = 0
    let result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    coords.push([lat / 1e5, lng / 1e5])
  }
  return coords
}

// 規劃自行車路線，回傳 null 表示失敗
export async function 規劃騎車路線(
  waypoints: [number, number][],
): Promise<OsrmResult | null> {
  if (waypoints.length < 2) return null

  // OSRM 格式：lng,lat;lng,lat
  const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';')
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=polyline`

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as {
      code: string
      routes?: Array<{
        geometry: string
        distance: number
        duration: number
      }>
    }
    if (data.code !== 'Ok' || !data.routes?.length) return null

    const route = data.routes[0]
    const coordinates = decodePolyline(route.geometry)
    return {
      coordinates,
      distance: Math.round(route.distance / 100) / 10,  // m → km
      duration: Math.round(route.duration / 60),          // s → min
    }
  } catch {
    return null
  }
}
