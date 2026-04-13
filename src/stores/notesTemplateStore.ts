import { create } from 'zustand'
import type { NotesTemplate } from '../types'
import { 取得目前AuthUserId, supabase } from '../utils/supabase'

interface NotesTemplateState {
  備註範本列表: NotesTemplate[]
  載入中: boolean
  載入備註範本: () => Promise<void>
  新增備註範本: (template: NotesTemplate) => Promise<void>
  更新備註範本: (template: NotesTemplate) => Promise<void>
  刪除備註範本: (id: string) => Promise<void>
}

async function 取得必要AuthUserId(): Promise<string> {
  const authUserId = await 取得目前AuthUserId()
  if (!authUserId) {
    throw new Error('登入狀態已失效，請重新登入後再試')
  }
  return authUserId
}

function 轉換為備註範本(row: Record<string, unknown>): NotesTemplate {
  return {
    id: row.id as string,
    name: (row.name as string) || '',
    notes: (row.notes as string) || '',
    creatorId: row.creator_id as string,
    creatorAuthUserId: (row.creator_auth_user_id as string) || undefined,
  }
}

function 轉換為資料列(t: NotesTemplate) {
  return {
    id: t.id,
    name: t.name,
    notes: t.notes,
    creator_id: t.creatorId,
    creator_auth_user_id: t.creatorAuthUserId ?? null,
  }
}

export const useNotesTemplateStore = create<NotesTemplateState>()((set) => ({
  備註範本列表: [],
  載入中: false,

  載入備註範本: async () => {
    set({ 載入中: true })
    const { data, error } = await supabase
      .from('notes_templates')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) {
      set({ 備註範本列表: data.map(轉換為備註範本) })
    }
    set({ 載入中: false })
  },

  新增備註範本: async (template) => {
    const authUserId = await 取得必要AuthUserId()
    const row = {
      ...轉換為資料列({ ...template, creatorAuthUserId: authUserId }),
      creator_auth_user_id: authUserId,
    }
    const { error } = await supabase.from('notes_templates').insert(row)
    if (error) {
      throw new Error(error.message || '新增備註範本失敗')
    }
    set((s) => ({ 備註範本列表: [{ ...template, creatorAuthUserId: authUserId }, ...s.備註範本列表] }))
  },

  更新備註範本: async (template) => {
    await 取得必要AuthUserId()
    const row = 轉換為資料列(template)
    const { error } = await supabase.from('notes_templates').update(row).eq('id', template.id)
    if (error) {
      throw new Error(error.message || '更新備註範本失敗')
    }
    set((s) => ({
      備註範本列表: s.備註範本列表.map(t => t.id === template.id ? template : t),
    }))
  },

  刪除備註範本: async (id) => {
    await 取得必要AuthUserId()
    const { error } = await supabase.from('notes_templates').delete().eq('id', id)
    if (error) {
      throw new Error(error.message || '刪除備註範本失敗')
    }
    set((s) => ({ 備註範本列表: s.備註範本列表.filter(t => t.id !== id) }))
  },
}))
