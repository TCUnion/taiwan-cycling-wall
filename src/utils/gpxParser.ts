import type { GpxParseResult } from '../types'

// Haversine 公式計算兩點距離（公里）
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// 降采樣：保留 maxPoints 個等距點（Douglas-Peucker 太複雜，用等距即可）
export function 簡化座標(
  coords: [number, number][],
  maxPoints = 2000,
): [number, number][] {
  if (coords.length <= maxPoints) return coords
  const step = coords.length / maxPoints
  const result: [number, number][] = []
  for (let i = 0; i < maxPoints; i++) {
    result.push(coords[Math.round(i * step)])
  }
  // 確保最後一點
  if (result[result.length - 1] !== coords[coords.length - 1]) {
    result.push(coords[coords.length - 1])
  }
  return result
}

// 解析 GPX XML 字串
export function 解析GPX(xml: string): GpxParseResult {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')

  // 取得名稱
  const nameEl = doc.querySelector('trk > name') || doc.querySelector('name')
  const name = nameEl?.textContent?.trim() || '未命名路線'

  // 取得所有軌跡點
  const trkpts = Array.from(doc.querySelectorAll('trkpt'))
  const coordinates: [number, number][] = []
  const elevations: number[] = []

  for (const pt of trkpts) {
    const lat = parseFloat(pt.getAttribute('lat') || '')
    const lng = parseFloat(pt.getAttribute('lon') || '')
    if (isNaN(lat) || isNaN(lng)) continue
    coordinates.push([lat, lng])
    const eleEl = pt.querySelector('ele')
    if (eleEl) {
      const ele = parseFloat(eleEl.textContent || '')
      if (!isNaN(ele)) elevations.push(ele)
    }
  }

  // 計算總距離（公里）
  let distance = 0
  for (let i = 1; i < coordinates.length; i++) {
    distance += haversine(
      coordinates[i - 1][0], coordinates[i - 1][1],
      coordinates[i][0], coordinates[i][1],
    )
  }

  // 計算正向總爬升（公尺）
  let elevation = 0
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i - 1]
    if (diff > 0) elevation += diff
  }

  const pointCount = coordinates.length
  const simplified = 簡化座標(coordinates)

  return {
    name,
    coordinates: simplified,
    distance: Math.round(distance * 10) / 10,
    elevation: Math.round(elevation),
    pointCount,
  }
}
