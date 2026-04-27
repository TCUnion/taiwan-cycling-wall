import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 公布欄版型
// classic   — 軟木便利貼（預設）
// newsprint — 單車週報（報紙式）
// timeline  — 日程帳本（依日期分組）
// atlas     — 台灣地圖（地理視角）
export type WallLayout = 'classic' | 'newsprint' | 'timeline' | 'atlas'

interface WallLayoutState {
  版型: WallLayout
  設定版型: (layout: WallLayout) => void
}

export const useWallLayoutStore = create<WallLayoutState>()(
  persist(
    (set) => ({
      版型: 'classic',
      設定版型: (layout) => set({ 版型: layout }),
    }),
    { name: '約騎-wall-layout' }
  )
)

export const 版型選項: { value: WallLayout; label: string; eyebrow: string }[] = [
  { value: 'classic',   label: '軟木便利貼', eyebrow: 'CLASSIC' },
  { value: 'newsprint', label: '單車週報',   eyebrow: 'NEWSPRINT' },
  { value: 'timeline',  label: '日程帳本',   eyebrow: 'LEDGER' },
  { value: 'atlas',     label: '台灣地圖',   eyebrow: 'ATLAS' },
]
