import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CloudRain,
  CloudRainWind,
  Loader2,
  MapPin,
  RefreshCcw,
  ThermometerSnowflake,
  ThermometerSun,
  Wind,
} from 'lucide-react'
import WeatherTaiwanMap from '../components/weather/WeatherTaiwanMap'
import { 載入縣市天氣預報, type CountyForecast, type WeatherPoint } from '../utils/weatherService'
import type { Region } from '../types'

const 區域選項: Array<{ id: 'all' | Region; label: string }> = [
  { id: 'all', label: '全部' },
  { id: '北部', label: '北部' },
  { id: '中部', label: '中部' },
  { id: '南部', label: '南部' },
  { id: '東部', label: '東部' },
]

function 格式化時段(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`
}

function 分組為天(forecasts: WeatherPoint[]): Array<{ date: string; slots: WeatherPoint[] }> {
  const m = new Map<string, WeatherPoint[]>()
  for (const f of forecasts) {
    const d = new Date(f.forecast_time)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const arr = m.get(key)
    if (arr) arr.push(f)
    else m.set(key, [f])
  }
  return Array.from(m.entries()).map(([date, slots]) => ({ date, slots }))
}

const TAG_META: Record<string, { text: string; cls: string; Icon: typeof CloudRain }> = {
  heavy_rain_risk: { text: '高降雨機率', cls: 'bg-blue-100 text-blue-800 border-blue-200', Icon: CloudRainWind },
  rainy:           { text: '有雨',       cls: 'bg-blue-50 text-blue-700 border-blue-200',  Icon: CloudRain },
  strong_wind:     { text: '強風',       cls: 'bg-amber-100 text-amber-800 border-amber-200', Icon: Wind },
  windy:           { text: '風大',       cls: 'bg-amber-50 text-amber-700 border-amber-200',  Icon: Wind },
  hot:             { text: '高溫',       cls: 'bg-red-100 text-red-800 border-red-200',   Icon: ThermometerSun },
  heat_stress:     { text: '體感酷熱',   cls: 'bg-red-200 text-red-900 border-red-300',   Icon: ThermometerSun },
  cold:            { text: '低溫',       cls: 'bg-cyan-100 text-cyan-800 border-cyan-200', Icon: ThermometerSnowflake },
  good:            { text: '適合騎車',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: ThermometerSun },
}

/** 依日切的時段算騎乘建議標籤 */
function 計算建議標籤(slots: WeatherPoint[]): string[] {
  if (slots.length === 0) return []
  const temps = slots.map((s) => Number(s.temp)).filter(Number.isFinite)
  const feels = slots.map((s) => Number(s.feels_like)).filter(Number.isFinite)
  const pops = slots.map((s) => Number(s.pop ?? 0))
  const winds = slots.map((s) => Number(s.wind_speed ?? 0))
  const maxT = temps.length ? Math.max(...temps) : 0
  const minT = temps.length ? Math.min(...temps) : 0
  const maxFeels = feels.length ? Math.max(...feels) : 0
  const maxPop = Math.max(...pops, 0)
  const maxWind = Math.max(...winds, 0)
  const tags: string[] = []
  if (maxPop >= 0.6) tags.push('heavy_rain_risk')
  else if (maxPop >= 0.4) tags.push('rainy')
  if (maxWind >= 10) tags.push('strong_wind')
  else if (maxWind >= 8) tags.push('windy')
  if (maxT >= 35) tags.push('hot')
  if (maxFeels >= 38) tags.push('heat_stress')
  if (minT <= 10) tags.push('cold')
  if (tags.length === 0) tags.push('good')
  return tags
}

function 日標題(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  const wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  if (diff === 0) return `今天 ${d.getMonth() + 1}/${d.getDate()}（${wk}）`
  if (diff === 1) return `明天 ${d.getMonth() + 1}/${d.getDate()}（${wk}）`
  return `${d.getMonth() + 1}/${d.getDate()}（週${wk}）`
}

export default function WeatherPage() {
  const [資料, 設資料] = useState<CountyForecast[]>([])
  const [載入中, 設載入中] = useState(true)
  const [錯誤, 設錯誤] = useState<string | null>(null)
  const [區域, 設區域] = useState<'all' | Region>('all')
  const [選取縣市Id, 設選取縣市Id] = useState<string | null>(null)
  const 詳情Ref = useRef<HTMLElement | null>(null)
  const 使用者點擊Ref = useRef(false)

  const 點選縣市 = (id: string) => {
    使用者點擊Ref.current = true
    設選取縣市Id(id)
  }

  const 重新載入 = async () => {
    設載入中(true)
    設錯誤(null)
    try {
      const list = await 載入縣市天氣預報()
      設資料(list)
      if (!選取縣市Id && list.length > 0) {
        // 預設選台北
        設選取縣市Id(list.find((it) => it.county.id === 'taipei')?.county.id ?? list[0].county.id)
      }
    } catch (e) {
      console.error(e)
      設錯誤('載入失敗，請稍後重試')
    } finally {
      設載入中(false)
    }
  }

  useEffect(() => {
    重新載入()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 使用者點選 → 平滑捲到詳情區（首次預設選取不捲動）
  useEffect(() => {
    if (!選取縣市Id || !使用者點擊Ref.current) return
    使用者點擊Ref.current = false
    const id = window.requestAnimationFrame(() => {
      詳情Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [選取縣市Id])

  const 篩選資料 = useMemo(() => {
    if (區域 === 'all') return 資料
    return 資料.filter((it) => it.county.region === 區域)
  }, [資料, 區域])

  const 選取資料 = useMemo(() => 資料.find((it) => it.county.id === 選取縣市Id) ?? null, [資料, 選取縣市Id])

  const 分日 = useMemo(() => (選取資料 ? 分組為天(選取資料.forecasts) : []), [選取資料])

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-gray-900">天氣預報</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">全台 22 縣市 · 未來 5 天逐 3 小時</p>
        </div>
        <button
          onClick={重新載入}
          disabled={載入中}
          aria-label="重新載入"
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors duration-200"
        >
          {載入中 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
          重新整理
        </button>
      </header>

      {/* 區域篩選 */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {區域選項.map((opt) => {
          const active = 區域 === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => 設區域(opt.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium border cursor-pointer transition-colors duration-200 ${
                active
                  ? 'bg-strava text-white border-strava'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {錯誤 && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {錯誤}
        </div>
      )}

      {/* 地圖 */}
      <WeatherTaiwanMap
        資料={篩選資料}
        選取縣市Id={選取縣市Id}
        onSelect={點選縣市}
        className="h-[420px] sm:h-[560px]"
      />

      {/* 縣市快速選擇 */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {篩選資料.map((it) => {
          const active = it.county.id === 選取縣市Id
          return (
            <button
              key={it.county.id}
              onClick={() => 點選縣市(it.county.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium border cursor-pointer transition-colors duration-200 ${
                active
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {it.county.name}
              {it.current?.temp != null && (
                <span className="ml-1 text-gray-400">{Number(it.current.temp).toFixed(0)}°</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 選取縣市詳情 */}
      {選取資料 && (
        <section
          ref={詳情Ref}
          className="mt-5 scroll-mt-4 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <MapPin className="w-4 h-4 text-strava" />
            <h2 className="text-base sm:text-lg font-bold text-gray-900">{選取資料.county.name}</h2>
            <span className="text-xs text-gray-500">
              格點 ({選取資料.point.lat_round.toFixed(1)}, {選取資料.point.lon_round.toFixed(1)})
            </span>
            {選取資料.current?.fetched_at && (
              <span className="ml-auto text-[11px] text-gray-400">
                更新於 {new Date(選取資料.current.fetched_at).toLocaleString('zh-TW', { hour12: false })}
              </span>
            )}
          </div>

          {選取資料.forecasts.length === 0 ? (
            <p className="text-sm text-gray-500">暫無預報資料（n8n 排程尚未拉取此格點）。</p>
          ) : (
            <>
              {/* 當下 / 最近時段 */}
              {選取資料.current && (
                <div className="mb-4 flex items-center gap-3 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 p-3 border border-blue-100">
                  {選取資料.current.icon && (
                    <img
                      src={`https://openweathermap.org/img/wn/${選取資料.current.icon}@2x.png`}
                      alt={選取資料.current.weather_desc ?? ''}
                      className="w-16 h-16"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-3xl font-bold text-gray-900 leading-none">
                      {Number(選取資料.current.temp ?? 0).toFixed(0)}°C
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        體感 {Number(選取資料.current.feels_like ?? 0).toFixed(0)}°
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      {選取資料.current.weather_desc ?? 選取資料.current.weather_main}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <CloudRain className="w-3 h-3 text-blue-500" />
                        雨機率 {Math.round(Number(選取資料.current.pop ?? 0) * 100)}%
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Wind className="w-3 h-3 text-amber-600" />
                        風速 {Number(選取資料.current.wind_speed ?? 0).toFixed(1)} m/s
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ThermometerSun className="w-3 h-3 text-red-500" />
                        濕度 {選取資料.current.humidity ?? '–'}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 分日 */}
              <div className="space-y-3">
                {分日.map(({ date, slots }) => {
                  const temps = slots.map((s) => Number(s.temp)).filter(Number.isFinite)
                  const maxT = temps.length ? Math.max(...temps) : null
                  const minT = temps.length ? Math.min(...temps) : null
                  const maxPop = Math.max(...slots.map((s) => Number(s.pop ?? 0)))
                  const 標籤 = 計算建議標籤(slots)
                  return (
                    <div key={date}>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-800">{日標題(date)}</span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {minT != null && maxT != null ? `${minT.toFixed(0)}–${maxT.toFixed(0)}°` : '–'}
                          <span className="ml-2 text-blue-600">雨 {Math.round(maxPop * 100)}%</span>
                        </span>
                      </div>
                      {標籤.length > 0 && (
                        <div className="mb-1.5 flex flex-wrap gap-1">
                          {標籤.map((tag) => {
                            const meta = TAG_META[tag]
                            if (!meta) return null
                            const { Icon, text, cls } = meta
                            return (
                              <span
                                key={tag}
                                className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${cls}`}
                              >
                                <Icon className="w-3 h-3" />
                                {text}
                              </span>
                            )
                          })}
                        </div>
                      )}
                      <div className="overflow-x-auto -mx-1 px-1">
                        <div className="flex gap-1.5">
                          {slots.map((s) => (
                            <div
                              key={s.forecast_time}
                              className="flex-1 flex-shrink-0 min-w-[64px] rounded-md border border-gray-100 bg-gray-50/50 px-1.5 py-1 text-center"
                            >
                              <div className="text-[10px] text-gray-500 leading-tight">
                                {格式化時段(s.forecast_time)}
                              </div>
                              {s.icon && (
                                <img
                                  src={`https://openweathermap.org/img/wn/${s.icon}.png`}
                                  alt={s.weather_desc ?? ''}
                                  className="w-8 h-8 mx-auto"
                                  loading="lazy"
                                />
                              )}
                              <div className="text-xs font-semibold text-gray-800 leading-tight">
                                {Number(s.temp ?? 0).toFixed(0)}°
                              </div>
                              <div className="text-[10px] text-blue-600 leading-tight">
                                {Math.round(Number(s.pop ?? 0) * 100)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </section>
      )}

      <p className="mt-4 text-center text-[11px] text-gray-400">
        資料來源：OpenWeatherMap · 由 n8n 排程更新至 Supabase
      </p>
    </div>
  )
}
