import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CyclingEvent, Region, StickyColor } from '../types'
import { 模擬活動 } from '../data/mockEvents'

type 排序方式 = '最新' | '最熱門'

interface EventState {
  活動列表: CyclingEvent[]
  篩選區域: Region | null
  排序: 排序方式
  設定篩選區域: (region: Region | null) => void
  設定排序: (sort: 排序方式) => void
  新增活動: (event: CyclingEvent) => void
  參加活動: (eventId: string, userId: string) => void
  退出活動: (eventId: string, userId: string) => void
  取得篩選後活動: () => CyclingEvent[]
}

// 根據ID產生固定的便利貼顏色
const 便利貼顏色列表: StickyColor[] = ['yellow', 'pink', 'blue', 'green']
export const 取得便利貼顏色 = (id: string): StickyColor => {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return 便利貼顏色列表[Math.abs(hash) % 4]
}

// 根據ID產生固定的旋轉角度 class
export const 取得旋轉角度 = (id: string): string => {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  const 角度 = (Math.abs(hash) % 5) - 2
  return `sticky-rotate-${角度 < 0 ? 'n' + Math.abs(角度) : 角度}`
}

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      活動列表: 模擬活動,
      篩選區域: null,
      排序: '最新',
      設定篩選區域: (region) => set({ 篩選區域: region }),
      設定排序: (sort) => set({ 排序: sort }),
      新增活動: (event) => set((state) => ({
        活動列表: [event, ...state.活動列表],
      })),
      參加活動: (eventId, userId) => set((state) => ({
        活動列表: state.活動列表.map(e =>
          e.id === eventId && !e.participants.includes(userId)
            ? { ...e, participants: [...e.participants, userId] }
            : e
        ),
      })),
      退出活動: (eventId, userId) => set((state) => ({
        活動列表: state.活動列表.map(e =>
          e.id === eventId
            ? { ...e, participants: e.participants.filter(p => p !== userId) }
            : e
        ),
      })),
      取得篩選後活動: () => {
        const { 活動列表, 篩選區域, 排序 } = get()
        let 結果 = 篩選區域
          ? 活動列表.filter(e => e.region === 篩選區域)
          : [...活動列表]
        if (排序 === '最新') {
          結果.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        } else {
          結果.sort((a, b) => b.participants.length - a.participants.length)
        }
        return 結果
      },
    }),
    { name: '約騎-events' }
  )
)
