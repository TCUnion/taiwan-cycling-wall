import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RideTemplate } from '../types'

interface TemplateState {
  範本列表: RideTemplate[]
  新增範本: (template: RideTemplate) => void
  刪除範本: (id: string) => void
  更新範本: (id: string, 更新: Partial<RideTemplate>) => void
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set) => ({
      範本列表: [],
      新增範本: (template) => set((s) => ({
        範本列表: [template, ...s.範本列表],
      })),
      刪除範本: (id) => set((s) => ({
        範本列表: s.範本列表.filter(t => t.id !== id),
      })),
      更新範本: (id, 更新) => set((s) => ({
        範本列表: s.範本列表.map(t => t.id === id ? { ...t, ...更新 } : t),
      })),
    }),
    { name: '約騎-templates' }
  )
)
