import { create } from 'zustand'
import type { NotesTemplate } from '../types'
import { supabase } from '../utils/supabase'

interface NotesTemplateState {
  備註範本列表: NotesTemplate[]
  載入中: boolean
  載入備註範本: () => Promise<void>
  新增備註範本: (template: NotesTemplate) => Promise<void>
  更新備註範本: (template: NotesTemplate) => Promise<void>
  刪除備註範本: (id: string) => Promise<void>
}

function 轉換為備註範本(row: Record<string, unknown>): NotesTemplate {
  return {
    id: row.id as string,
    name: (row.name as string) || '',
    notes: (row.notes as string) || '',
    creatorId: row.creator_id as string,
  }
}

function 轉換為資料列(t: NotesTemplate) {
  return {
    id: t.id,
    name: t.name,
    notes: t.notes,
    creator_id: t.creatorId,
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
    const row = 轉換為資料列(template)
    const { error } = await supabase.from('notes_templates').insert(row)
    if (!error) {
      set((s) => ({ 備註範本列表: [template, ...s.備註範本列表] }))
    }
  },

  更新備註範本: async (template) => {
    const row = 轉換為資料列(template)
    const { error } = await supabase.from('notes_templates').update(row).eq('id', template.id)
    if (!error) {
      set((s) => ({
        備註範本列表: s.備註範本列表.map(t => t.id === template.id ? template : t),
      }))
    }
  },

  刪除備註範本: async (id) => {
    const { error } = await supabase.from('notes_templates').delete().eq('id', id)
    if (!error) {
      set((s) => ({ 備註範本列表: s.備註範本列表.filter(t => t.id !== id) }))
    }
  },
}))
