import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, Polyline, Marker } from 'leaflet'

// 修正 Vite 打包 Leaflet 圖示路徑問題
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 修正預設 icon 路徑
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

interface RouteMapProps {
  coordinates?: [number, number][]  // 折線座標 [lat, lng][]
  waypoints?: [number, number][]    // 航點（顯示帶號碼的 Marker）
  interactive?: boolean             // 啟用地圖點擊
  onMapClick?: (lat: number, lng: number) => void
  className?: string
}

export default function RouteMap({
  coordinates = [],
  waypoints = [],
  interactive = false,
  onMapClick,
  className = 'h-64',
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const polylineRef = useRef<Polyline | null>(null)
  const markersRef = useRef<Marker[]>([])

  // 初始化地圖（只跑一次）
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [23.5, 121],
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: interactive,
      dragging: interactive || false,
      doubleClickZoom: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    if (interactive && onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng)
      })
    }

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 更新折線
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    if (coordinates.length >= 2) {
      const line = L.polyline(coordinates, { color: '#FC4C02', weight: 3, opacity: 0.85 })
      line.addTo(map)
      polylineRef.current = line
      map.fitBounds(line.getBounds(), { padding: [20, 20] })
    }
  }, [coordinates])

  // 更新航點 Markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    waypoints.forEach(([lat, lng], i) => {
      const icon = L.divIcon({
        html: `<div style="background:#FC4C02;color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)">${i + 1}</div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      const marker = L.marker([lat, lng], { icon }).addTo(map)
      markersRef.current.push(marker)
    })
  }, [waypoints])

  return <div ref={containerRef} className={`w-full rounded-xl overflow-hidden ${className}`} />
}
