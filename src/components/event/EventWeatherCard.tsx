import { useEffect, useMemo, useState } from 'react'
import {
  CloudRain,
  CloudRainWind,
  Wind,
  Thermometer,
  ThermometerSun,
  ThermometerSnowflake,
  Loader2,
  Cloud,
} from 'lucide-react'
import { 查找縣市 } from '../../data/counties'

interface Props {
  /** 路線座標陣列；有的話用第一順位（路線中點） */
  座標: [number, number][]
  /** 約騎日期 YYYY-MM-DD */
  日期: string
  /** 縣市 ID（fallback：當沒路線時用縣市中心點） */
  縣市Id?: string
  /** 活動標題（給 webhook 留紀錄用，可省） */
  活動標題?: string
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

export default function EventWeatherCard({ 座標, 日期, 縣市Id, 活動標題 }: Props) {
  // 優先用路線中點；沒路線就用縣市中心當 fallback
  const 中點 = useMemo(() => {
    if (座標 && 座標.length > 0) {
      const mid = 座標[Math.floor(座標.length / 2)]
      return { lat: mid[0], lon: mid[1], source: 'route' as const }
    }
    if (縣市Id) {
      const c = 查找縣市(縣市Id)
      if (c) return { lat: c.lat, lon: c.lng, source: 'county' as const }
    }
    return null
  }, [座標, 縣市Id])

  const [data, setData] = useState<WeatherResp | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 取天氣是合法副作用（fetch + 設 loading flag），不適用 set-state-in-effect 規則
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!中點 || !日期) return

    const ctrl = new AbortController()
    setLoading(true)
    setError(null)

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: 中點.lat,
        lon: 中點.lon,
        date: 日期,
        event_name: 活動標題,
      }),
      signal: ctrl.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return (await r.json()) as WeatherResp
      })
      .then((d) => {
        if (!d || !d.summary) {
          setData(null)
          return
        }
        setData(d)
      })
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return
        setError('天氣查詢失敗')
        setData(null)
      })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [中點, 日期, 活動標題])

  if (!中點 || !日期) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-bold text-gray-700">當日天氣預報</h3>
        {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
        {中點?.source === 'county' && (
          <span className="text-xs text-gray-400">縣市概估</span>
        )}
        {data?.cached === false && (
          <span className="text-xs text-gray-400">即時查詢</span>
        )}
      </div>

      {error && (
        <p className="text-sm text-gray-500">{error}（不影響活動建立）</p>
      )}

      {data && data.summary.slots === 0 && !loading && (
        <p className="text-sm text-gray-500">該日期尚無預報資料（OpenWeatherMap 僅支援未來 5 天）。</p>
      )}

      {data && data.summary.slots > 0 && (
        <>
          {data.summary.alert_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {data.summary.alert_tags.map((tag) => {
                const meta = TAG_LABEL[tag]
                if (!meta) return null
                const { Icon, text, cls } = meta
                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${cls}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {text}
                  </span>
                )
              })}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div className="rounded-lg bg-gray-50 p-2">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <Thermometer className="w-3 h-3" />
                氣溫
              </div>
              <div className="text-sm font-bold text-gray-800">
                {Number(data.summary.min_temp).toFixed(0)}–{Number(data.summary.max_temp).toFixed(0)}°
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-2">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <CloudRain className="w-3 h-3" />
                最高雨機率
              </div>
              <div className="text-sm font-bold text-gray-800">
                {Math.round(Number(data.summary.max_pop) * 100)}%
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-2">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <Wind className="w-3 h-3" />
                最大風速
              </div>
              <div className="text-sm font-bold text-gray-800">
                {Number(data.summary.max_wind).toFixed(1)} m/s
              </div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-2 px-2">
            <div className="inline-flex gap-2 min-w-full">
              {data.forecasts.map((f) => (
                <div
                  key={f.forecast_time}
                  className="flex-shrink-0 rounded-lg border border-gray-100 bg-white px-2 py-1.5 text-center min-w-[64px]"
                >
                  <div className="text-[10px] text-gray-500">{格式化時段(f.forecast_time)}</div>
                  <img
                    src={`https://openweathermap.org/img/wn/${f.icon}.png`}
                    alt={f.weather_desc}
                    className="w-8 h-8 mx-auto"
                    loading="lazy"
                  />
                  <div className="text-xs font-medium text-gray-700">
                    {Number(f.temp).toFixed(0)}°
                  </div>
                  <div className="text-[10px] text-blue-600">
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
