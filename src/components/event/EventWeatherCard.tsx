import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CloudRain,
  CloudRainWind,
  Wind,
  ThermometerSun,
  ThermometerSnowflake,
  Loader2,
  Cloud,
  MapPin,
} from 'lucide-react'
import { 查找縣市 } from '../../data/counties'
import { 解析地圖座標 } from '../../utils/geoUtils'

interface Props {
  座標: [number, number][]
  日期: string
  /** HH:MM；有的話預報只顯示集合時間前後 6 小時的時段 */
  時間?: string
  縣市Id?: string
  集合地點?: string
  集合地點URL?: string
  活動標題?: string
  /** 拿到資料時回呼（給外層組複製文字用） */
  onData?: (data: WeatherResp | null) => void
}

interface ForecastSlot {
  forecast_time: string
  temp: number | string
  feels_like: number | string
  humidity: number
  pop: number | string
  rain_3h: number | string
  wind_speed: number | string
  wind_deg: number
  weather_main: string
  weather_desc: string
  icon: string
}

interface Summary {
  slots: number
  max_pop: number
  max_wind: number
  max_temp: number
  min_temp: number
  max_feels: number
  avg_temp: number
  alert_tags: string[]
}

interface WeatherResp {
  cached: boolean
  date: string
  lat_round: number
  lon_round: number
  forecasts: ForecastSlot[]
  summary: Summary
}

const WEBHOOK_URL =
  import.meta.env.VITE_WEATHER_WEBHOOK_URL ||
  'https://service.criterium.tw/webhook/event-weather-check'

const TAG_LABEL: Record<string, { text: string; cls: string; Icon: typeof CloudRain }> = {
  heavy_rain_risk: { text: '高降雨機率', cls: 'bg-blue-100 text-blue-800 border-blue-200', Icon: CloudRainWind },
  rainy:           { text: '有雨',       cls: 'bg-blue-50 text-blue-700 border-blue-200',  Icon: CloudRain },
  strong_wind:     { text: '強風',       cls: 'bg-amber-100 text-amber-800 border-amber-200', Icon: Wind },
  windy:           { text: '風大',       cls: 'bg-amber-50 text-amber-700 border-amber-200',  Icon: Wind },
  hot:             { text: '高溫',       cls: 'bg-red-100 text-red-800 border-red-200',   Icon: ThermometerSun },
  heat_stress:     { text: '體感酷熱',   cls: 'bg-red-200 text-red-900 border-red-300',   Icon: ThermometerSun },
  cold:            { text: '低溫',       cls: 'bg-cyan-100 text-cyan-800 border-cyan-200', Icon: ThermometerSnowflake },
}

function 格式化時段(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`
}

export default function EventWeatherCard({
  座標, 日期, 時間, 縣市Id, 集合地點, 集合地點URL, 活動標題, onData,
}: Props) {
  // 來源優先序：集合地點 URL → 路線中點 → 縣市中心
  const 中點 = useMemo(() => {
    if (集合地點URL) {
      const c = 解析地圖座標(集合地點URL)
      if (c) return { ...c, source: 'spot' as const, label: 集合地點 || '集合地點' }
    }
    if (座標 && 座標.length > 0) {
      const mid = 座標[Math.floor(座標.length / 2)]
      return { lat: mid[0], lon: mid[1], source: 'route' as const, label: '路線中點' }
    }
    if (縣市Id) {
      const c = 查找縣市(縣市Id)
      if (c) return { lat: c.lat, lon: c.lng, source: 'county' as const, label: c.name }
    }
    return null
  }, [集合地點URL, 集合地點, 座標, 縣市Id])

  const [data, setData] = useState<WeatherResp | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 用 ref 保存 onData，避免父層每次 render 重新建函式造成 effect 重跑
  const onDataRef = useRef(onData)
  onDataRef.current = onData

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!中點 || !日期) return

    const ctrl = new AbortController()
    setLoading(true)
    setError(null)

    // 後端依 UTC 日期切片，台灣凌晨/深夜時段會落在前後一天 → 平行抓 date-1 / date / date+1 後合併
    // 用 UTC 算術避免時區漂移（new Date(YYYY-MM-DDT00:00:00) 在 +8 區會被 toISOString 轉成前一天）
    const 偏移日期 = (offset: number): string => {
      const [y, m, d] = 日期.split('-').map(Number)
      const ms = Date.UTC(y, m - 1, d) + offset * 86400000
      return new Date(ms).toISOString().split('T')[0]
    }
    const 抓單日 = (d: string) => fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: 中點.lat, lon: 中點.lon, date: d, event_name: 活動標題 }),
      signal: ctrl.signal,
    }).then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return (await r.json()) as WeatherResp
    }).catch((e) => {
      if ((e as Error).name === 'AbortError') throw e
      return null
    })

    Promise.all([偏移日期(-1), 日期, 偏移日期(1)].map(抓單日))
      .then((results) => {
        const valid = results.filter((r): r is WeatherResp => !!(r && r.summary))
        if (valid.length === 0) { setData(null); return }
        const map = new Map<string, ForecastSlot>()
        for (const r of valid) for (const f of r.forecasts) map.set(f.forecast_time, f)
        const merged = Array.from(map.values()).sort((a, b) =>
          new Date(a.forecast_time).getTime() - new Date(b.forecast_time).getTime()
        )
        setData({ ...valid[0], date: 日期, forecasts: merged, summary: { ...valid[0].summary, slots: merged.length } })
      })
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return
        setError('天氣查詢失敗')
        setData(null)
      })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [中點, 日期, 活動標題])

  // 預報窗口：集合時間 ±6h（含活動前後緩衝）
  const 顯示預報 = useMemo(() => {
    if (!data) return [] as ForecastSlot[]
    const all = data.forecasts
    if (!時間 || !/^\d{2}:\d{2}$/.test(時間)) return all
    const meet = new Date(`${日期}T${時間}:00`).getTime()
    const start = meet - 6 * 3600 * 1000
    const end   = meet + 6 * 3600 * 1000
    return all.filter((f) => {
      const t = new Date(f.forecast_time).getTime()
      return t >= start && t <= end
    })
  }, [data, 時間, 日期])

  // 用窗口內的時段重算摘要（後端的 summary 是整天，不符使用者期待）
  const 摘要 = useMemo(() => {
    const slots = 顯示預報
    if (slots.length === 0) return null
    const temps = slots.map(s => Number(s.temp)).filter(Number.isFinite)
    const feels = slots.map(s => Number(s.feels_like)).filter(Number.isFinite)
    const pops  = slots.map(s => Number(s.pop)).filter(Number.isFinite)
    const winds = slots.map(s => Number(s.wind_speed)).filter(Number.isFinite)
    const max_temp  = temps.length ? Math.max(...temps) : 0
    const min_temp  = temps.length ? Math.min(...temps) : 0
    const max_feels = feels.length ? Math.max(...feels) : 0
    const max_pop   = pops.length  ? Math.max(...pops)  : 0
    const max_wind  = winds.length ? Math.max(...winds) : 0
    const tags: string[] = []
    if (max_pop  >= 0.6) tags.push('heavy_rain_risk')
    else if (max_pop >= 0.4) tags.push('rainy')
    if (max_wind >= 10)  tags.push('strong_wind')
    else if (max_wind >= 8) tags.push('windy')
    if (max_temp >= 35)  tags.push('hot')
    if (max_feels >= 38) tags.push('heat_stress')
    if (min_temp <= 10)  tags.push('cold')
    return { slots: slots.length, max_temp, min_temp, max_feels, max_pop, max_wind, alert_tags: tags }
  }, [顯示預報])

  // 把窗口內重算後的資料回呼給外層（給複製文字用）
  useEffect(() => {
    if (!data || !摘要) {
      onDataRef.current?.(null)
      return
    }
    onDataRef.current?.({
      ...data,
      summary: { ...data.summary, ...摘要 },
      forecasts: 顯示預報,
    })
  }, [data, 摘要, 顯示預報])

  if (!中點 || !日期) return null

  const 來源文字 = 中點.source === 'spot'
    ? `集合：${中點.label}`
    : 中點.source === 'route'
      ? '依路線中點'
      : `依縣市：${中點.label}`

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Cloud className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-bold text-gray-700">當日天氣預報</h3>
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="w-3 h-3" />
          {來源文字}
        </span>
        {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin ml-auto" />}
      </div>

      {error && (
        <p className="text-sm text-gray-500">{error}（不影響活動建立）</p>
      )}

      {data && 顯示預報.length === 0 && !loading && (
        <p className="text-sm text-gray-500">該時段尚無預報資料（OpenWeatherMap 僅支援未來 5 天）。</p>
      )}

      {data && 摘要 && 顯示預報.length > 0 && (
        <>
          {摘要.alert_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {摘要.alert_tags.map((tag) => {
                const meta = TAG_LABEL[tag]
                if (!meta) return null
                const { Icon, text, cls } = meta
                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${cls}`}
                  >
                    <Icon className="w-3 h-3" />
                    {text}
                  </span>
                )
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-700 mb-2">
            <span>
              氣溫{' '}
              <span className="font-semibold text-gray-900">
                {摘要.min_temp.toFixed(0)}–{摘要.max_temp.toFixed(0)}°
              </span>
            </span>
            <span>
              雨機率{' '}
              <span className="font-semibold text-gray-900">
                {Math.round(摘要.max_pop * 100)}%
              </span>
            </span>
            <span>
              最大風速{' '}
              <span className="font-semibold text-gray-900">
                {摘要.max_wind.toFixed(1)} m/s
              </span>
            </span>
          </div>

          <div className="overflow-x-auto -mx-1 px-1">
            <div className="flex gap-1.5 min-w-full">
              {顯示預報.map((f) => (
                <div
                  key={f.forecast_time}
                  className="flex-1 flex-shrink-0 min-w-[58px] rounded-md border border-gray-100 bg-gray-50/50 px-1.5 py-1 text-center"
                >
                  <div className="text-[10px] text-gray-500 leading-tight">{格式化時段(f.forecast_time)}</div>
                  <img
                    src={`https://openweathermap.org/img/wn/${f.icon}.png`}
                    alt={f.weather_desc}
                    className="w-7 h-7 mx-auto"
                    loading="lazy"
                  />
                  <div className="text-xs font-medium text-gray-700 leading-tight">
                    {Number(f.temp).toFixed(0)}°
                  </div>
                  <div className="text-[10px] text-blue-600 leading-tight">
                    {Math.round(Number(f.pop) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
