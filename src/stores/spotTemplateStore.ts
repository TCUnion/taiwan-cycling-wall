import { create } from 'zustand'
import type { SpotTemplate } from '../types'
import { supabase } from '../utils/supabase'

interface SpotTemplateState {
  集合點範本列表: SpotTemplate[]
  載入中: boolean
  載入集合點範本: () => Promise<void>
  新增集合點範本: (template: SpotTemplate) => Promise<void>
  更新集合點範本: (template: SpotTemplate) => Promise<void>
  刪除集合點範本: (id: string) => Promise<void>
}

// Supabase snake_case → 前端 camelCase
function 轉換為集合點範本(row: Record<string, unknown>): SpotTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    url: (row.url as string) || '',
    countyId: (row.county_id as string) || '',
    creatorId: row.creator_id as string,
  }
}

// 前端 camelCase → Supabase snake_case
function 轉換為資料列(t: SpotTemplate) {
  return {
    id: t.id,
    name: t.name,
    url: t.url,
    county_id: t.countyId,
    creator_id: t.creatorId,
  }
}

export const useSpotTemplateStore = create<SpotTemplateState>()((set) => ({
  集合點範本列表: [],
  載入中: false,

  載入集合點範本: async () => {
    set({ 載入中: true })
    const { data, error } = await supabase
      .from('spot_templates')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) {
      set({ 集合點範本列表: data.map(轉換為集合點範本) })
    }
    set({ 載入中: false })
  },

  新增集合點範本: async (template) => {
    const row = 轉換為資料列(template)
    const { error } = await supabase.from('spot_templates').insert(row)
    if (!error) {
      set((s) => ({ 集合點範本列表: [template, ...s.集合點範本列表] }))
    }
  },

  更新集合點範本: async (template) => {
    const row = 轉換為資料列(template)
    const { error } = await supabase.from('spot_templates').update(row).eq('id', template.id)
    if (!error) {
      set((s) => ({
        集合點範本列表: s.集合點範本列表.map(t => t.id === template.id ? template : t),
      }))
    }
  },

  刪除集合點範本: async (id) => {
    const { error } = await supabase.from('spot_templates').delete().eq('id', id)
    if (!error) {
      set((s) => ({ 集合點範本列表: s.集合點範本列表.filter(t => t.id !== id) }))
    }
  },
}))
