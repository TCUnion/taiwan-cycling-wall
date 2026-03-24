import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Region } from '../types'

interface RegionState {
  選擇的區域: Region | null
  選擇的縣市: string | null
  設定區域: (region: Region | null) => void
  設定縣市: (countyId: string | null) => void
}

export const useRegionStore = create<RegionState>()(
  persist(
    (set) => ({
      選擇的區域: null,
      選擇的縣市: null,
      設定區域: (region) => set({ 選擇的區域: region }),
      設定縣市: (countyId) => set({ 選擇的縣市: countyId }),
    }),
    { name: '約騎-region' }
  )
)
