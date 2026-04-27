// 便利貼卡上的小型天氣指示：只顯示集合時間最接近的一個時段
// 氣溫 + 降雨機率，OWM 5 天外的活動直接不顯示

import { useEffect, useState } from 'react'
import type { CyclingEvent } from '../../types'
import { 查找縣市 } from '../../data/counties'

interface ForecastSlot {
  forecast_time: string
  temp: number | string
  pop: number | string
  icon: string
  weather_desc: string
}

interface WeatherResp {
  forecasts: ForecastSlot[]
  summary: { slots: number }
}

const WEBHOOK_URL =
  import.meta.env.VITE_WEATHER_WEBHOOK_URL ||
  'https://service.criterium.tw/webhook/event-weather-check'

// 解析 Google Maps URL 抓 lat/lon
function 解析地圖座標(url?: string): { lat: number; lon: number } | null {
  if (!url) return null
  const decoded = (() => { try { return decodeURIComponent(url) } catch { return url } })()
  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&]q=loc:(-?\d+(?:\.\d+)?)[, ]\s*(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?)[, ]\s*(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?)[, ]\s*(-?\d+(?:\.\d+)?)/,
  ]
  for (const p of patterns) {
    const m = decoded.match(p)
    if (m && m[1] && m[2]) {
      const lat = Number(m[1])
      const lon = Number(m[2])
      if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        return { lat, lon }
      }
    }
  }
  return null
}

interface Props {
  活動: CyclingEvent
}

export default function EventWeatherInline({ 活動 }: Props) {
  const [slot, setSlot] = useState<ForecastSlot | null>(null)

  useEffect(() => {
    // OWM 只給未來 5 天，太遠的活動直接不顯示
    const eventTime = new Date(`${活動.date}T${活動.time || '00:00'}:00`).getTime()
    if (Number.isNaN(eventTime)) return
    const diffDays = (eventTime - Date.now()) / 86400_000
    if (diffDays < -0.5 || diffDays > 5) return

    // 座標來源：集合地點 URL → 路線中點 → 縣市中心
    let lat: number | undefined
    let lon: number | undefined
    const fromUrl = 解析地圖座標(活動.meetingPointUrl)
    if (fromUrl) {
      lat = fromUrl.lat
      lon = fromUrl.lon
    } else if (活動.routeCoordinates && 活動.routeCoordinates.length > 0) {
      const mid = 活動.routeCoordinates[Math.floor(活動.routeCoordinates.length / 2)]
      lat = mid[0]; lon = mid[1]
    } else {
      const c = 查找縣市(活動.countyId)
      if (c) { lat = c.lat; lon = c.lng }
    }
    if (lat == null || lon == null) return

    const ctrl = new AbortController()
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon, date: 活動.date, event_name: 活動.title }),
      signal: ctrl.signal,
    })
      .then(r => r.ok ? (r.json() as Promise<WeatherResp>) : Promise.reject())
      .then((d) => {
        if (!d?.forecasts?.length) return
        // 找最接近 eventTime 的時段
        const closest = d.forecasts.reduce((best, f) => {
          const diff = Math.abs(new Date(f.forecast_time).getTime() - eventTime)
          return diff < best.diff ? { f, diff } : best
        }, { f: d.forecasts[0], diff: Number.POSITIVE_INFINITY }).f
        setSlot(closest)
      })
      .catch(() => undefined)

    return () => ctrl.abort()
  }, [活動.date, 活動.time, 活動.meetingPointUrl, 活動.routeCoordinates, 活動.countyId, 活動.title])

  if (!slot) return null

  const temp = Number(slot.temp)
  const pop = Math.round(Number(slot.pop) * 100)

  return (
    <div className="flex items-center gap-1.5 text-[0.68rem] text-siokiu-ink/70">
      <img
        src={`https://openweathermap.org/img/wn/${slot.icon}.png`}
        alt={slot.weather_desc}
        className="w-5 h-5"
        loading="lazy"
      />
      <span className="font-mono font-semibold">{Number.isFinite(temp) ? `${temp.toFixed(0)}°` : '-'}</span>
      <span className="font-mono text-blue-700/80">雨 {pop}%</span>
    </div>
  )
}
