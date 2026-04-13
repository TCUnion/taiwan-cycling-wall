import { create } from 'zustand'
import type { RouteInfoTemplate } from '../types'
import { 取得目前AuthUserId, supabase } from '../utils/supabase'

interface RouteInfoTemplateState {
  路線範本列表: RouteInfoTemplate[]
  載入中: boolean
  載入路線範本: () => Promise<void>
  新增路線範本: (template: RouteInfoTemplate) => Promise<void>
  更新路線範本: (template: RouteInfoTemplate) => Promise<void>
  刪除路線範本: (id: string) => Promise<void>
}

async function 取得必要AuthUserId(): Promise<string> {
  const authUserId = await 取得目前AuthUserId()
  if (!authUserId) {
    throw new Error('登入狀態已失效，請重新登入後再試')
  }
  return authUserId
}

function 轉換為路線範本(row: Record<string, unknown>): RouteInfoTemplate {
  return {
    id: row.id as string,
    name: (row.name as string) || '',
    routeName: (row.route_name as string) || '',
    routeDetail: (row.route_detail as string) || '',
    routeUrl: (row.route_url as string) || '',
    distance: (row.distance as number) || 0,
    elevation: (row.elevation as number) || 0,
    pace: (row.pace as string) || '',
    maxParticipants: (row.max_participants as number) || 0,
    creatorId: row.creator_id as string,
    creatorAuthUserId: (row.creator_auth_user_id as string) || undefined,
  }
}

function 轉換為資料列(t: RouteInfoTemplate) {
  return {
    id: t.id,
    name: t.name,
    route_name: t.routeName,
    route_detail: t.routeDetail,
    route_url: t.routeUrl,
    distance: t.distance,
    elevation: t.elevation,
    pace: t.pace,
    max_participants: t.maxParticipants,
    creator_id: t.creatorId,
    creator_auth_user_id: t.creatorAuthUserId ?? null,
  }
}

export const useRouteInfoTemplateStore = create<RouteInfoTemplateState>()((set) => ({
  路線範本列表: [],
  載入中: false,

  載入路線範本: async () => {
    set({ 載入中: true })
    const { data, error } = await supabase
      .from('route_info_templates')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) {
      set({ 路線範本列表: data.map(轉換為路線範本) })
    }
    set({ 載入中: false })
  },

  新增路線範本: async (template) => {
    const authUserId = await 取得必要AuthUserId()
    const row = {
      ...轉換為資料列({ ...template, creatorAuthUserId: authUserId }),
      creator_auth_user_id: authUserId,
    }
    const { error } = await supabase.from('route_info_templates').insert(row)
    if (error) {
      throw new Error(error.message || '新增路線範本失敗')
    }
    set((s) => ({ 路線範本列表: [{ ...template, creatorAuthUserId: authUserId }, ...s.路線範本列表] }))
  },

  更新路線範本: async (template) => {
    await 取得必要AuthUserId()
    const row = 轉換為資料列(template)
    const { error } = await supabase.from('route_info_templates').update(row).eq('id', template.id)
    if (error) {
      throw new Error(error.message || '更新路線範本失敗')
    }
    set((s) => ({
      路線範本列表: s.路線範本列表.map(t => t.id === template.id ? template : t),
    }))
  },

  刪除路線範本: async (id) => {
    await 取得必要AuthUserId()
    const { error } = await supabase.from('route_info_templates').delete().eq('id', id)
    if (error) {
      throw new Error(error.message || '刪除路線範本失敗')
    }
    set((s) => ({ 路線範本列表: s.路線範本列表.filter(t => t.id !== id) }))
  },
}))
