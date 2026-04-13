import { create } from 'zustand'
import type { RideTemplate } from '../types'
import { 取得目前AuthUserId, supabase } from '../utils/supabase'

interface TemplateState {
  範本列表: RideTemplate[]
  載入中: boolean
  載入範本: () => Promise<void>
  新增範本: (template: RideTemplate) => Promise<void>
  刪除範本: (id: string) => Promise<void>
}

async function 取得必要AuthUserId(): Promise<string> {
  const authUserId = await 取得目前AuthUserId()
  if (!authUserId) {
    throw new Error('登入狀態已失效，請重新登入後再試')
  }
  return authUserId
}

// Supabase snake_case → 前端 camelCase
function 轉換為範本(row: Record<string, unknown>): RideTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    routeName: row.route_name as string,
    routeDetail: (row.route_detail as string) || '',
    routeUrl: (row.route_url as string) || '',
    spotName: (row.spot_name as string) || '',
    spotUrl: (row.spot_url as string) || '',
    countyId: (row.county_id as string) || '',
    time: (row.time as string) || '06:00',
    distance: (row.distance as number) || 0,
    elevation: (row.elevation as number) || 0,
    pace: (row.pace as string) || '',
    maxParticipants: (row.max_participants as number) || 0,
    notes: JSON.parse((row.notes as string) || '[]'),
    creatorId: row.creator_id as string,
    creatorAuthUserId: (row.creator_auth_user_id as string) || undefined,
    creatorName: (row.creator_name as string) || '',
  }
}

// 前端 camelCase → Supabase snake_case
function 轉換為資料列(t: RideTemplate) {
  return {
    id: t.id,
    name: t.name,
    route_name: t.routeName,
    route_detail: t.routeDetail,
    route_url: t.routeUrl,
    spot_name: t.spotName,
    spot_url: t.spotUrl,
    county_id: t.countyId,
    time: t.time,
    distance: t.distance,
    elevation: t.elevation,
    pace: t.pace,
    max_participants: t.maxParticipants,
    notes: JSON.stringify(t.notes),
    creator_id: t.creatorId,
    creator_auth_user_id: t.creatorAuthUserId ?? null,
    creator_name: t.creatorName || '',
  }
}

export const useTemplateStore = create<TemplateState>()((set) => ({
  範本列表: [],
  載入中: false,

  載入範本: async () => {
    set({ 載入中: true })
    const { data, error } = await supabase
      .from('ride_templates')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) {
      set({ 範本列表: data.map(轉換為範本) })
    }
    set({ 載入中: false })
  },

  新增範本: async (template) => {
    const authUserId = await 取得必要AuthUserId()
    const row = {
      ...轉換為資料列({ ...template, creatorAuthUserId: authUserId }),
      creator_auth_user_id: authUserId,
    }
    const { error } = await supabase.from('ride_templates').insert(row)
    if (error) {
      throw new Error(error.message || '新增範本失敗')
    }
    // 同步更新本地 state
    set((s) => ({ 範本列表: [{ ...template, creatorAuthUserId: authUserId }, ...s.範本列表] }))
  },

  刪除範本: async (id) => {
    await 取得必要AuthUserId()
    const { error } = await supabase.from('ride_templates').delete().eq('id', id)
    if (error) {
      throw new Error(error.message || '刪除範本失敗')
    }
    set((s) => ({ 範本列表: s.範本列表.filter(t => t.id !== id) }))
  },
}))
