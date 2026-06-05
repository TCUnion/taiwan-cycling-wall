import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, LayerGroup } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { 自行車道, 觀光景點 } from '../../utils/tdxService'

interface ExploreMapProps {
  自行車道: 自行車道[]
  景點: 觀光景點[]
  中心: [number, number]
  className?: string
}

// HTML escape，避免景點名稱/地址含特殊字元破壞 popup
function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c))
}

export default function ExploreMap({ 自行車道, 景點, 中心, className = 'h-[60vh]' }: ExploreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const 車道圖層 = useRef<LayerGroup | null>(null)
  const 景點圖層 = useRef<LayerGroup | null>(null)

  // 初始化地圖（一次）
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { center: 中心, zoom: 11, scrollWheelZoom: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)
    車道圖層.current = L.layerGroup().addTo(map)
    景點圖層.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 縣市切換 → 移動中心
  useEffect(() => {
    mapRef.current?.setView(中心, 11)
  }, [中心])

  // 自行車道圖層
  useEffect(() => {
    const layer = 車道圖層.current
    if (!layer) return
    layer.clearLayers()
    自行車道.forEach((道) => {
      道.線段.forEach((seg) => {
        L.polyline(seg, { color: '#00B900', weight: 4, opacity: 0.8 })
          .bindPopup(`<strong>${esc(道.名稱)}</strong><br/>${esc(道.起點)} → ${esc(道.終點)}<br/>${道.長度公里} 公里`)
          .addTo(layer)
      })
    })
  }, [自行車道])

  // 景點圖層
  useEffect(() => {
    const layer = 景點圖層.current
    if (!layer) return
    layer.clearLayers()
    景點.forEach((s) => {
      const icon = L.divIcon({
        html: `<div style="background:#FC4C02;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      const img = s.圖片網址
        ? `<img src="${esc(s.圖片網址)}" alt="" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:4px"/>`
        : ''
      const addr = s.地址 ? `<br/>${esc(s.地址)}` : ''
      L.marker([s.緯度, s.經度], { icon })
        .bindPopup(`${img}<strong>${esc(s.名稱)}</strong>${addr}`, { maxWidth: 220 })
        .addTo(layer)
    })
  }, [景點])

  return <div ref={containerRef} className={`w-full rounded-xl overflow-hidden ${className}`} />
}
