// 地理座標相關工具：Google Maps URL 解析、Haversine 距離計算、集合點/路線起點一致性檢查

export interface 座標 {
  lat: number
  lon: number
}

export interface 一致性警告 {
  距離公里: number
  集合點座標: 座標
  路線起點座標: 座標
}

const 座標URL樣式: RegExp[] = [
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  /[?&]q=loc:(-?\d+(?:\.\d+)?)[, ]\s*(-?\d+(?:\.\d+)?)/,
  /[?&]q=(-?\d+(?:\.\d+)?)[, ]\s*(-?\d+(?:\.\d+)?)/,
  /[?&]ll=(-?\d+(?:\.\d+)?)[, ]\s*(-?\d+(?:\.\d+)?)/,
]

function 座標有效(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
}

// 從 Google Maps URL 解析 lat/lon。shortened URL（maps.app.goo.gl）無法解析，回傳 null
export function 解析地圖座標(url?: string | null): 座標 | null {
  if (!url) return null
  const decoded = (() => { try { return decodeURIComponent(url) } catch { return url } })()
  for (const p of 座標URL樣式) {
    const m = decoded.match(p)
    if (m && m[1] && m[2]) {
      const lat = Number(m[1])
      const lon = Number(m[2])
      if (座標有效(lat, lon)) return { lat, lon }
    }
  }
  return null
}

// Haversine 公式計算兩點距離（公里）
export function 計算座標距離公里(a: 座標, b: 座標): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

// 檢查集合點 URL 與路線起點是否距離超過閾值；無法檢查時回傳 null
// 路線起點來源優先序：路線庫座標[0] → 外部路線起點座標（Strava/RWGPS API 回傳）
export function 建立集合點路線起點警告(params: {
  集合點URL?: string | null
  路線座標?: [number, number][]
  外部路線起點?: 座標 | null
  閾值公里?: number
}): 一致性警告 | null {
  const { 集合點URL, 路線座標, 外部路線起點, 閾值公里 = 1 } = params
  const 集合點 = 解析地圖座標(集合點URL)
  if (!集合點) return null

  let 路線起點: 座標 | null = null
  if (路線座標 && 路線座標.length > 0) {
    const [lat, lon] = 路線座標[0]
    if (座標有效(lat, lon)) 路線起點 = { lat, lon }
  }
  if (!路線起點 && 外部路線起點 && 座標有效(外部路線起點.lat, 外部路線起點.lon)) {
    路線起點 = 外部路線起點
  }
  if (!路線起點) return null

  const 距離公里 = 計算座標距離公里(集合點, 路線起點)
  if (距離公里 <= 閾值公里) return null
  return { 距離公里, 集合點座標: 集合點, 路線起點座標: 路線起點 }
}
