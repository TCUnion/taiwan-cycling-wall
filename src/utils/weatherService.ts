import { supabase } from './supabase'
import { 縣市列表 } from '../data/counties'
import type { County } from '../types'

/**
 * weather_points 表格欄位（由 n8n workflow 每 N 小時 upsert）
 * 主鍵：(lat_round, lon_round, forecast_time)
 */
export interface WeatherPoint {
  lat_round: number
  lon_round: number
  forecast_time: string
  temp: number | null
  feels_like: number | null
  humidity: number | null
  pop: number | null
  rain_3h: number | null
  wind_speed: number | null
  wind_deg: number | null
  weather_main: string | null
  weather_desc: string | null
  icon: string | null
  fetched_at: string | null
}

export interface CountyForecast {
  county: County
  /** 與該縣市中心最接近的格點 */
  point: { lat_round: number; lon_round: number }
  /** 未來預報時段（按時間升冪） */
  forecasts: WeatherPoint[]
  /** 「現在 / 最近的一個時段」 */
  current: WeatherPoint | null
}

const r1 = (n: number) => Math.round(n * 10) / 10

/** 從 weather_points 撈未來所有預報，依縣市中心最近格點分組 */
export async function 載入縣市天氣預報(): Promise<CountyForecast[]> {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('weather_points')
    .select(
      'lat_round, lon_round, forecast_time, temp, feels_like, humidity, pop, rain_3h, wind_speed, wind_deg, weather_main, weather_desc, icon, fetched_at',
    )
    .gte('forecast_time', nowIso)
    .order('forecast_time', { ascending: true })
    .limit(2000)

  if (error) {
    console.error('[weatherService] 載入失敗', error)
    return []
  }

  const points = (data ?? []) as WeatherPoint[]

  // 以 (lat_round, lon_round) 分組
  const byKey = new Map<string, WeatherPoint[]>()
  for (const p of points) {
    const key = `${p.lat_round},${p.lon_round}`
    const arr = byKey.get(key)
    if (arr) arr.push(p)
    else byKey.set(key, [p])
  }

  const allKeys = Array.from(byKey.keys()).map((k) => {
    const [a, b] = k.split(',').map(Number)
    return { key: k, lat: a, lon: b }
  })

  // 為每個縣市挑最接近的格點
  return 縣市列表.map((c): CountyForecast => {
    // 先試精確 round
    const exactKey = `${r1(c.lat)},${r1(c.lng)}`
    let chosen = byKey.get(exactKey)
      ? { key: exactKey, lat: r1(c.lat), lon: r1(c.lng) }
      : null

    // 找不到就找最近的（n8n 與 counties 之間若有 round 邊界差異時 fallback）
    if (!chosen && allKeys.length > 0) {
      let best = allKeys[0]
      let bestD = Number.POSITIVE_INFINITY
      for (const k of allKeys) {
        const d = (k.lat - c.lat) ** 2 + (k.lon - c.lng) ** 2
        if (d < bestD) {
          bestD = d
          best = k
        }
      }
      // 距離過遠（>0.5°，約 55km）視為無資料
      if (bestD <= 0.25) chosen = best
    }

    const list = chosen ? byKey.get(chosen.key) ?? [] : []
    return {
      county: c,
      point: chosen
        ? { lat_round: chosen.lat, lon_round: chosen.lon }
        : { lat_round: r1(c.lat), lon_round: r1(c.lng) },
      forecasts: list,
      current: list[0] ?? null,
    }
  })
}
