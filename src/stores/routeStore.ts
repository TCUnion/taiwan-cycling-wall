import { create } from 'zustand'
import type { SavedRoute, RouteSource } from '../types'
import { supabase } from '../utils/supabase'

interface RouteState {
  路線列表: SavedRoute[]
  載入中: boolean
  載入路線: (creatorId: string) => Promise<void>
  新增路線: (route: SavedRoute) => Promise<void>
  更新路線: (route: SavedRoute) => Promise<void>
  刪除路線: (id: string) => Promise<void>
}

function 轉換為路線(row: Record<string, unknown>): SavedRoute {
  return {
    id: row.id as string,
    name: (row.name as string) || '',
    distance: Number(row.distance) || 0,
    elevation: Number(row.elevation) || 0,
    countyId: (row.county_id as string) || '',
    coordinates: (row.coordinates as [number, number][]) || [],
    waypoints: (row.waypoints as [number, number][]) || [],
    source: ((row.source as string) || 'manual') as RouteSource,
    gpxFileName: (row.gpx_file_name as string) || undefined,
    creatorId: row.creator_id as string,
    isPublic: Boolean(row.is_public),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function 轉換為資料列(r: SavedRoute) {
  return {
    id: r.id,
    name: r.name,
    distance: r.distance,
    elevation: r.elevation,
    county_id: r.countyId,
    coordinates: r.coordinates,
    waypoints: r.waypoints,
    source: r.source,
    gpx_file_name: r.gpxFileName || null,
    creator_id: r.creatorId,
    is_public: r.isPublic,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }
}

export const useRouteStore = create<RouteState>()((set) => ({
  路線列表: [],
  載入中: false,

  載入路線: async (creatorId) => {
    set({ 載入中: true })
    const { data, error } = await supabase
      .from('saved_routes')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
    if (!error && data) {
      set({ 路線列表: data.map(轉換為路線) })
    }
    set({ 載入中: false })
  },

  新增路線: async (route) => {
    const row = 轉換為資料列(route)
    const { error } = await supabase.from('saved_routes').insert(row)
    if (!error) {
      set((s) => ({ 路線列表: [route, ...s.路線列表] }))
    }
  },

  更新路線: async (route) => {
    const row = 轉換為資料列(route)
    const { error } = await supabase.from('saved_routes').update(row).eq('id', route.id)
    if (!error) {
      set((s) => ({
        路線列表: s.路線列表.map(r => r.id === route.id ? route : r),
      }))
    }
  },

  刪除路線: async (id) => {
    const { error } = await supabase.from('saved_routes').delete().eq('id', id)
    if (!error) {
      set((s) => ({ 路線列表: s.路線列表.filter(r => r.id !== id) }))
    }
  },
}))
