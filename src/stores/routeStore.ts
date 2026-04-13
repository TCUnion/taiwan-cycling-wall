import { create } from 'zustand'
import type { SavedRoute, RouteSource } from '../types'
import { 取得目前AuthUserId, supabase } from '../utils/supabase'

interface RouteState {
  路線列表: SavedRoute[]
  載入中: boolean
  載入路線: (creatorId: string, creatorAuthUserId?: string) => Promise<void>
  新增路線: (route: SavedRoute) => Promise<boolean>
  更新路線: (route: SavedRoute) => Promise<void>
  刪除路線: (id: string) => Promise<void>
}

async function 取得必要AuthUserId(): Promise<string> {
  const authUserId = await 取得目前AuthUserId()
  if (!authUserId) {
    throw new Error('登入狀態已失效，請重新登入後再試')
  }
  return authUserId
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
    creatorAuthUserId: (row.creator_auth_user_id as string) || undefined,
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
    creator_auth_user_id: r.creatorAuthUserId ?? null,
    is_public: r.isPublic,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }
}

export const useRouteStore = create<RouteState>()((set) => ({
  路線列表: [],
  載入中: false,

  載入路線: async (creatorId, creatorAuthUserId) => {
    set({ 載入中: true })
    let query = supabase
      .from('saved_routes')
      .select('*')
      .order('created_at', { ascending: false })

    if (creatorAuthUserId) {
      query = query.eq('creator_auth_user_id', creatorAuthUserId)
    } else {
      query = query.eq('creator_id', creatorId)
    }

    const { data, error } = await query
    if (!error && data) {
      set({ 路線列表: data.map(轉換為路線) })
    }
    set({ 載入中: false })
  },

  新增路線: async (route) => {
    try {
      const authUserId = await 取得必要AuthUserId()
      const row = {
        ...轉換為資料列({ ...route, creatorAuthUserId: authUserId }),
        creator_auth_user_id: authUserId,
      }
      const { error } = await supabase.from('saved_routes').insert(row)
      if (error) {
        console.error('新增路線失敗:', error.message)
        return false
      }
      set((s) => ({ 路線列表: [{ ...route, creatorAuthUserId: authUserId }, ...s.路線列表] }))
      return true
    } catch (error) {
      console.error('新增路線失敗:', error instanceof Error ? error.message : error)
      return false
    }
  },

  更新路線: async (route) => {
    await 取得必要AuthUserId()
    const row = 轉換為資料列(route)
    const { error } = await supabase.from('saved_routes').update(row).eq('id', route.id)
    if (error) {
      throw new Error(error.message || '更新路線失敗')
    }
    set((s) => ({
      路線列表: s.路線列表.map(r => r.id === route.id ? route : r),
    }))
  },

  刪除路線: async (id) => {
    await 取得必要AuthUserId()
    const { error } = await supabase.from('saved_routes').delete().eq('id', id)
    if (error) {
      throw new Error(error.message || '刪除路線失敗')
    }
    set((s) => ({ 路線列表: s.路線列表.filter(r => r.id !== id) }))
  },
}))
