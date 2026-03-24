import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { 模擬使用者 } from '../data/mockUsers'

interface AuthState {
  使用者: User | null
  已登入: boolean
  登入: (userId: string) => void
  登出: () => void
  更新使用者: (更新: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      使用者: null,
      已登入: false,
      登入: (userId: string) => {
        const 找到的使用者 = 模擬使用者.find(u => u.id === userId)
        if (找到的使用者) {
          set({ 使用者: 找到的使用者, 已登入: true })
        }
      },
      登出: () => set({ 使用者: null, 已登入: false }),
      更新使用者: (更新) => set((state) => ({
        使用者: state.使用者 ? { ...state.使用者, ...更新 } : null,
      })),
    }),
    { name: '約騎-auth' }
  )
)
