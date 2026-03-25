import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, PageIdentity } from '../types'
import { 模擬使用者 } from '../data/mockUsers'

interface AuthState {
  使用者: User | null
  已登入: boolean
  所有使用者: User[]
  目前身份: 'personal' | 'page'
  使用中的粉絲頁: PageIdentity | null
  登入: (userId: string) => void
  FB登入: (fbId: string, name: string, pictureUrl: string, countyId?: string) => void
  註冊: (name: string, avatar: string, countyId: string) => void
  登出: () => void
  更新使用者: (更新: Partial<User>) => void
  設定粉絲頁列表: (pages: PageIdentity[]) => void
  切換到粉絲頁: (pageId: string) => void
  切換回個人: () => void
  取得目前發文身份: () => { id: string; name: string; avatar: string }
}

const 建立空白統計 = () => ({
  totalRides: 0,
  totalDistance: 0,
  totalElevation: 0,
  countiesVisited: [] as string[],
})

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      使用者: null,
      已登入: false,
      所有使用者: 模擬使用者,
      目前身份: 'personal',
      使用中的粉絲頁: null,
      登入: (userId: string) => {
        const 找到的使用者 = get().所有使用者.find(u => u.id === userId)
        if (找到的使用者) {
          set({ 使用者: 找到的使用者, 已登入: true })
        }
      },
      FB登入: (fbId: string, name: string, pictureUrl: string, countyId?: string) => {
        const id = `fb-${fbId}`
        // 已註冊過的 FB 使用者直接登入
        const 既有使用者 = get().所有使用者.find(u => u.id === id)
        if (既有使用者) {
          // 更新頭像（FB 頭像網址可能變動），若有新的縣市資訊且尚未設定則一併更新
          const 更新後 = {
            ...既有使用者,
            avatar: pictureUrl,
            countyId: 既有使用者.countyId || countyId || '',
          }
          set((state) => ({
            使用者: 更新後,
            已登入: true,
            所有使用者: state.所有使用者.map(u => u.id === id ? 更新後 : u),
          }))
          return
        }
        // 首次 FB 登入，建立新使用者
        const 新使用者: User = {
          id,
          name,
          avatar: pictureUrl,
          countyId: countyId || '',
          stats: 建立空白統計(),
          achievements: [],
          rideHistory: [],
        }
        set((state) => ({
          所有使用者: [...state.所有使用者, 新使用者],
          使用者: 新使用者,
          已登入: true,
        }))
      },
      註冊: (name: string, avatar: string, countyId: string) => {
        const 新使用者: User = {
          id: `user-${Date.now()}`,
          name,
          avatar,
          countyId,
          stats: 建立空白統計(),
          achievements: [],
          rideHistory: [],
        }
        set((state) => ({
          所有使用者: [...state.所有使用者, 新使用者],
          使用者: 新使用者,
          已登入: true,
        }))
      },
      登出: () => set({ 使用者: null, 已登入: false, 目前身份: 'personal', 使用中的粉絲頁: null }),
      更新使用者: (更新) => set((state) => ({
        使用者: state.使用者 ? { ...state.使用者, ...更新 } : null,
      })),
      設定粉絲頁列表: (pages: PageIdentity[]) => set((state) => {
        if (!state.使用者) return {}
        const 更新後使用者 = { ...state.使用者, managedPages: pages }
        return {
          使用者: 更新後使用者,
          所有使用者: state.所有使用者.map(u => u.id === 更新後使用者.id ? 更新後使用者 : u),
        }
      }),
      切換到粉絲頁: (pageId: string) => {
        const state = get()
        const 粉絲頁 = state.使用者?.managedPages?.find(p => p.pageId === pageId)
        if (!粉絲頁) return
        set({ 目前身份: 'page', 使用中的粉絲頁: 粉絲頁 })
      },
      切換回個人: () => set({ 目前身份: 'personal', 使用中的粉絲頁: null }),
      取得目前發文身份: () => {
        const state = get()
        if (state.目前身份 === 'page' && state.使用中的粉絲頁) {
          return {
            id: `page-${state.使用中的粉絲頁.pageId}`,
            name: state.使用中的粉絲頁.name,
            avatar: state.使用中的粉絲頁.pictureUrl,
          }
        }
        return {
          id: state.使用者?.id ?? '',
          name: state.使用者?.name ?? '',
          avatar: state.使用者?.avatar ?? '',
        }
      },
    }),
    { name: '約騎-auth' }
  )
)
