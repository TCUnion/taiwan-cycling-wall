import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Map as LeafletMap, Marker } from 'leaflet'
import type { CountyForecast } from '../../utils/weatherService'

interface Props {
  資料: CountyForecast[]
  選取縣市Id?: string | null
  onSelect?: (countyId: string) => void
  className?: string
}

const 區域色 = {
  '北部': '#3B82F6',
  '中部': '#F59E0B',
  '南部': '#EF4444',
  '東部': '#10B981',
} as const

/** 把 OWM icon 換成 emoji-less 簡單字型摘要（避免外部圖片載入慢） */
function temperatureColor(t: number | null | undefined): string {
  if (t == null || !Number.isFinite(t)) return '#6B7280'
  if (t >= 33) return '#DC2626'
  if (t >= 28) return '#F97316'
  if (t >= 22) return '#F59E0B'
  if (t >= 16) return '#10B981'
  if (t >= 10) return '#3B82F6'
  return '#1E40AF'
}

function buildMarkerHtml(item: CountyForecast, selected: boolean): string {
  const t = item.current?.temp
  const pop = item.current?.pop
  const tempStr = t == null ? '–' : `${Number(t).toFixed(0)}°`
  const popStr = pop == null ? '' : `${Math.round(Number(pop) * 100)}%`
  const ring = selected ? '0 0 0 3px rgba(252,76,2,0.85)' : '0 1px 3px rgba(0,0,0,0.25)'
  const tempBg = temperatureColor(typeof t === 'number' ? t : null)
  const regionDot = 區域色[item.county.region]
  const icon = item.current?.icon
  const iconImg = icon
    ? `<img src="https://openweathermap.org/img/wn/${icon}.png" alt="" style="width:28px;height:28px;display:block;margin:-4px auto -2px" loading="lazy" />`
    : ''
  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:1px;cursor:pointer;">
      <div style="
        background:#fff;
        border:1.5px solid ${regionDot};
        border-radius:8px;
        padding:2px 4px 3px;
        min-width:54px;
        text-align:center;
        box-shadow:${ring};
        font:600 11px/1.1 'Noto Sans TC',system-ui,sans-serif;
        color:#1F2937;
      ">
        <div style="font-size:10px;color:#6B7280;font-weight:500;letter-spacing:.02em">${item.county.name}</div>
        ${iconImg}
        <div style="display:flex;justify-content:center;gap:4px;align-items:baseline">
          <span style="color:${tempBg};font-weight:700;font-size:13px;">${tempStr}</span>
          ${popStr ? `<span style="color:#2563EB;font-size:10px;">${popStr}</span>` : ''}
        </div>
      </div>
    </div>
  `
}

export default function WeatherTaiwanMap({ 資料, 選取縣市Id, onSelect, className = 'h-[560px]' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())

  const 資料Map = useMemo(() => {
    const m = new Map<string, CountyForecast>()
    for (const it of 資料) m.set(it.county.id, it)
    return m
  }, [資料])

  // 初始化地圖
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      center: [23.7, 121],
      zoom: 7,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)
    mapRef.current = map

    const markers = markersRef.current
    return () => {
      map.remove()
      mapRef.current = null
      markers.clear()
    }
  }, [])

  // 更新 markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // 清舊
    for (const [, mk] of markersRef.current) mk.remove()
    markersRef.current.clear()

    for (const item of 資料) {
      const isSelected = item.county.id === 選取縣市Id
      const html = buildMarkerHtml(item, isSelected)
      const icon = L.divIcon({
        html,
        className: 'weather-marker',
        iconSize: [60, 60],
        iconAnchor: [30, 30],
      })
      const marker = L.marker([item.county.lat, item.county.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : 0,
        riseOnHover: true,
      }).addTo(map)
      marker.on('click', () => onSelect?.(item.county.id))
      markersRef.current.set(item.county.id, marker)
    }
  }, [資料, 選取縣市Id, onSelect])

  // 選取的縣市 → 平移
  useEffect(() => {
    if (!選取縣市Id) return
    const item = 資料Map.get(選取縣市Id)
    if (!item || !mapRef.current) return
    mapRef.current.flyTo([item.county.lat, item.county.lng], Math.max(mapRef.current.getZoom(), 9), {
      duration: 0.8,
    })
  }, [選取縣市Id, 資料Map])

  return <div ref={containerRef} className={`w-full rounded-xl overflow-hidden border border-gray-200 ${className}`} />
}
