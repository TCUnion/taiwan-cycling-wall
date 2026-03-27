import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, PageIdentity, StravaProfile } from '../types'
import { 模擬使用者 } from '../data/mockUsers'
import { 取得使用者, upsert使用者, 更新使用者欄位 } from '../utils/userService'

interface AuthState {
  使用者: User | null
  已登入: boolean
  所有使用者: User[]
  目前身份: 'personal' | 'page'
  使用中的粉絲頁: PageIdentity | null
  登入: (userId: string) => void
  FB登入: (fbId: string, name: string, pictureUrl: string, countyId?: string) => void
  Google登入: (sub: string, name: string, pictureUrl: string, email: string) => void
  LINE登入: (userId: string, name: string, pictureUrl: string) => void
  Strava登入: (athleteId: number, name: string, pictureUrl: string, city: string, stravaProfile: StravaProfile) => void
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

/** 背景同步使用者到 Supabase（不阻塞 UI） */
function 背景同步(user: User) {
  upsert使用者(user).catch(() => {})
}

/** 背景更新部分欄位到 Supabase */
function 背景更新(id: string, fields: Partial<User>) {
  更新使用者欄位(id, fields).catch(() => {})
}

/**
 * 登入時嘗試從 Supabase 讀取既有資料，合併到本地使用者。
 * 若 Supabase 有資料，以 Supabase 的 countyId/stats/managedPages 為準（可能在其他裝置更新過），
 * 但頭像/名稱以當次登入取得的為準（社群平台最新資料）。
 */
async function 嘗試合併遠端資料(本地使用者: User): Promise<User> {
  try {
    const 遠端 = await 取得使用者(本地使用者.id)
    if (遠端) {
      return {
        ...本地使用者,
        // 遠端有值的欄位優先（跨裝置持久化的部分）
        countyId: 本地使用者.countyId || 遠端.countyId || '',
        stats: 遠端.stats ?? 本地使用者.stats,
        managedPages: 遠端.managedPages ?? 本地使用者.managedPages,
        stampImage: 遠端.stampImage ?? 本地使用者.stampImage,
        verifiedAt: 遠端.verifiedAt ?? 本地使用者.verifiedAt,
        lineVerifiedUserId: 遠端.lineVerifiedUserId ?? 本地使用者.lineVerifiedUserId,
      }
    }
  } catch {
    // Supabase 不可用時不影響登入
  }
  return 本地使用者
}

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
        const 既有使用者 = get().所有使用者.find(u => u.id === id)
        if (既有使用者) {
          const 更新後 = {
            ...既有使用者,
            avatar: pictureUrl,
            socialAvatar: pictureUrl,
            countyId: 既有使用者.countyId || countyId || '',
          }
          set((state) => ({
            使用者: 更新後,
            已登入: true,
            所有使用者: state.所有使用者.map(u => u.id === id ? 更新後 : u),
          }))
          // 背景：從 Supabase 合併 + 回寫
          嘗試合併遠端資料(更新後).then((合併後) => {
            set((state) => ({
              使用者: state.使用者?.id === id ? 合併後 : state.使用者,
              所有使用者: state.所有使用者.map(u => u.id === id ? 合併後 : u),
            }))
            背景同步(合併後)
          })
          return
        }
        const 新使用者: User = {
          id,
          name,
          avatar: pictureUrl,
          socialAvatar: pictureUrl,
          countyId: countyId || '',
          stats: 建立空白統計(),
          achievements: [],
          rideHistory: [],
          authProvider: 'facebook',
        }
        set((state) => ({
          所有使用者: [...state.所有使用者, 新使用者],
          使用者: 新使用者,
          已登入: true,
        }))
        // 背景：查 Supabase 是否有舊資料，合併後回寫
        嘗試合併遠端資料(新使用者).then((合併後) => {
          set((state) => ({
            使用者: state.使用者?.id === id ? 合併後 : state.使用者,
            所有使用者: state.所有使用者.map(u => u.id === id ? 合併後 : u),
          }))
          背景同步(合併後)
        })
      },
      Google登入: (sub: string, name: string, pictureUrl: string, email: string) => {
        const id = `google-${sub}`
        const 既有使用者 = get().所有使用者.find(u => u.id === id)
        if (既有使用者) {
          const 更新後 = { ...既有使用者, avatar: pictureUrl, socialAvatar: pictureUrl, email }
          set((state) => ({
            使用者: 更新後,
            已登入: true,
            所有使用者: state.所有使用者.map(u => u.id === id ? 更新後 : u),
          }))
          嘗試合併遠端資料(更新後).then((合併後) => {
            set((state) => ({
              使用者: state.使用者?.id === id ? 合併後 : state.使用者,
              所有使用者: state.所有使用者.map(u => u.id === id ? 合併後 : u),
            }))
            背景同步(合併後)
          })
          return
        }
        const 新使用者: User = {
          id,
          name,
          avatar: pictureUrl,
          socialAvatar: pictureUrl,
          countyId: '',
          stats: 建立空白統計(),
          achievements: [],
          rideHistory: [],
          authProvider: 'google',
          email,
        }
        set((state) => ({
          所有使用者: [...state.所有使用者, 新使用者],
          使用者: 新使用者,
          已登入: true,
        }))
        嘗試合併遠端資料(新使用者).then((合併後) => {
          set((state) => ({
            使用者: state.使用者?.id === id ? 合併後 : state.使用者,
            所有使用者: state.所有使用者.map(u => u.id === id ? 合併後 : u),
          }))
          背景同步(合併後)
        })
      },
      LINE登入: (userId: string, name: string, pictureUrl: string) => {
        const id = `line-${userId}`
        const 既有使用者 = get().所有使用者.find(u => u.id === id)
        if (既有使用者) {
          const 更新後 = { ...既有使用者, avatar: pictureUrl, socialAvatar: pictureUrl }
          set((state) => ({
            使用者: 更新後,
            已登入: true,
            所有使用者: state.所有使用者.map(u => u.id === id ? 更新後 : u),
          }))
          嘗試合併遠端資料(更新後).then((合併後) => {
            set((state) => ({
              使用者: state.使用者?.id === id ? 合併後 : state.使用者,
              所有使用者: state.所有使用者.map(u => u.id === id ? 合併後 : u),
            }))
            背景同步(合併後)
          })
          return
        }
        const 新使用者: User = {
          id,
          name,
          avatar: pictureUrl,
          socialAvatar: pictureUrl,
          countyId: '',
          stats: 建立空白統計(),
          achievements: [],
          rideHistory: [],
          authProvider: 'line',
        }
        set((state) => ({
          所有使用者: [...state.所有使用者, 新使用者],
          使用者: 新使用者,
          已登入: true,
        }))
        嘗試合併遠端資料(新使用者).then((合併後) => {
          set((state) => ({
            使用者: state.使用者?.id === id ? 合併後 : state.使用者,
            所有使用者: state.所有使用者.map(u => u.id === id ? 合併後 : u),
          }))
          背景同步(合併後)
        })
      },
      Strava登入: (athleteId: number, name: string, pictureUrl: string, city: string, stravaProfile: StravaProfile) => {
        const id = `strava-${athleteId}`
        const 既有使用者 = get().所有使用者.find(u => u.id === id)
        if (既有使用者) {
          const 更新後 = { ...既有使用者, avatar: pictureUrl, socialAvatar: pictureUrl, stravaProfile }
          set((state) => ({
            使用者: 更新後,
            已登入: true,
            所有使用者: state.所有使用者.map(u => u.id === id ? 更新後 : u),
          }))
          嘗試合併遠端資料(更新後).then((合併後) => {
            set((state) => ({
              使用者: state.使用者?.id === id ? 合併後 : state.使用者,
              所有使用者: state.所有使用者.map(u => u.id === id ? 合併後 : u),
            }))
            背景同步(合併後)
          })
          return
        }
        const countyId = city || ''
        const 新使用者: User = {
          id,
          name,
          avatar: pictureUrl,
          socialAvatar: pictureUrl,
          countyId,
          stats: 建立空白統計(),
          achievements: [],
          rideHistory: [],
          authProvider: 'strava',
          stravaProfile,
        }
        set((state) => ({
          所有使用者: [...state.所有使用者, 新使用者],
          使用者: 新使用者,
          已登入: true,
        }))
        嘗試合併遠端資料(新使用者).then((合併後) => {
          set((state) => ({
            使用者: state.使用者?.id === id ? 合併後 : state.使用者,
            所有使用者: state.所有使用者.map(u => u.id === id ? 合併後 : u),
          }))
          背景同步(合併後)
        })
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
        背景同步(新使用者)
      },
      登出: () => set({ 使用者: null, 已登入: false, 目前身份: 'personal', 使用中的粉絲頁: null }),
      更新使用者: (更新) => set((state) => {
        if (!state.使用者) return {}
        const 更新後使用者 = { ...state.使用者, ...更新 }
        // 背景同步到 Supabase
        背景更新(更新後使用者.id, 更新)
        return {
          使用者: 更新後使用者,
          所有使用者: state.所有使用者.map(u => u.id === 更新後使用者.id ? 更新後使用者 : u),
        }
      }),
      設定粉絲頁列表: (pages: PageIdentity[]) => set((state) => {
        if (!state.使用者) return {}
        const 更新後使用者 = { ...state.使用者, managedPages: pages }
        // 背景同步到 Supabase
        背景更新(更新後使用者.id, { managedPages: pages })
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
    {
      name: '約騎-auth',
      // 持久化前移除敏感的 accessToken，避免暴露於 localStorage
      partialize: (state) => ({
        ...state,
        使用者: state.使用者 ? {
          ...state.使用者,
          stravaProfile: state.使用者.stravaProfile
            ? { ...state.使用者.stravaProfile, accessToken: undefined }
            : undefined,
        } : null,
        所有使用者: state.所有使用者.map(u => ({
          ...u,
          stravaProfile: u.stravaProfile
            ? { ...u.stravaProfile, accessToken: undefined }
            : undefined,
        })),
      }),
    }
  )
)
