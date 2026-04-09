import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { supabase } from './utils/supabase'
import { 綁定GoogleAuth使用者, 綁定LINEAuth使用者 } from './utils/userService'

import AppShell from './components/layout/AppShell'

// 延遲載入頁面
const SplashPage = lazy(() => import('./pages/SplashPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const WallPage = lazy(() => import('./pages/WallPage'))
const CreateEventPage = lazy(() => import('./pages/CreateEventPage'))
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'))
const SharePage = lazy(() => import('./pages/SharePage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const DataDeletionPage = lazy(() => import('./pages/DataDeletionPage'))
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage'))
const LiffVerifyPage = lazy(() => import('./pages/LiffVerifyPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const RoutesPage = lazy(() => import('./pages/RoutesPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))

// 載入中畫面 — 與 SplashPage 風格一致
function Loading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-cream">
      <h1 className="font-serif text-5xl text-gray-900 tracking-tight select-none">siokiu</h1>
      <p className="mt-2 text-sm text-gray-400">相揪，呼朋引伴一起騎車</p>
      <div className="mt-6 w-6 h-6 rounded-full border-2 border-gray-300 border-t-strava animate-spin" />
    </div>
  )
}

function 取得LINE登入資料(authUser: {
  id: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
  identities?: Array<{ provider?: string; identity_data?: Record<string, unknown> }>
}) {
  const metadata = authUser.user_metadata as Record<string, unknown> | undefined
  const appMetadata = authUser.app_metadata as Record<string, unknown> | undefined
  const identities = authUser.identities ?? []
  const lineIdentity = identities.find(identity => identity.provider?.includes('line'))
  const 是LINEProvider = lineIdentity || String(appMetadata?.provider ?? '').includes('line')

  if (!是LINEProvider) return null

  return {
    lineUserId: (
      lineIdentity?.identity_data?.sub
      ?? metadata?.sub
      ?? metadata?.provider_id
      ?? authUser.id
    ) as string,
    name: (
      metadata?.full_name
      ?? metadata?.name
      ?? 'LINE 使用者'
    ) as string,
    picture: (metadata?.avatar_url ?? metadata?.picture ?? '') as string,
  }
}

// 需要登入的路由保護（預渲染時放行）
function RequireAuth({ children }: { children: React.ReactNode }) {
  const 已登入 = useAuthStore(s => s.已登入)
  if (!已登入) return <Navigate to="/login" replace />
  return <>{children}</>
}

// 管理員路由保護
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const 已登入 = useAuthStore(s => s.已登入)
  const 角色 = useAuthStore(s => s.使用者?.role)
  if (!已登入) return <Navigate to="/login" replace />
  if (角色 !== 'admin') return <Navigate to="/wall" replace />
  return <>{children}</>
}

export default function App() {
  const Google登入 = useAuthStore(s => s.Google登入)
  const LINE登入 = useAuthStore(s => s.LINE登入)

  useEffect(() => {
    let active = true

    const 同步社群Session = async () => {
      const { data: userData, error } = await supabase.auth.getUser()
      if (error || !userData.user || !active) return

      const authUser = userData.user
      const metadata = authUser.user_metadata as Record<string, unknown> | undefined
      const identities = ((authUser as unknown as { identities?: Array<{ provider?: string; identity_data?: Record<string, unknown> }> }).identities) ?? []

      const googleIdentity = identities.find(identity => identity.provider === 'google')
      if (googleIdentity) {
        const googleSub = (
          googleIdentity.identity_data?.sub
          ?? metadata?.sub
          ?? metadata?.provider_id
          ?? authUser.id
        ) as string
        const name = (
          metadata?.full_name
          ?? metadata?.name
          ?? (authUser.email ? authUser.email.split('@')[0] : 'Google 使用者')
        ) as string
        const picture = (metadata?.avatar_url ?? metadata?.picture ?? '') as string
        const email = authUser.email ?? (metadata?.email as string | undefined) ?? ''

        await 綁定GoogleAuth使用者({
          authUserId: authUser.id,
          googleSub,
          email,
          name,
          avatar: picture,
        })

        if (active) {
          Google登入(googleSub, name, picture, email, authUser.id)
        }
        return
      }

      const line資料 = 取得LINE登入資料(authUser as typeof authUser & {
        app_metadata?: Record<string, unknown>
        identities?: Array<{ provider?: string; identity_data?: Record<string, unknown> }>
      })
      if (line資料) {
        const 綁定結果 = await 綁定LINEAuth使用者({
          authUserId: authUser.id,
          lineUserId: line資料.lineUserId,
          name: line資料.name,
          avatar: line資料.picture,
        })

        if (active && 綁定結果?.authUserId) {
          LINE登入(line資料.lineUserId, line資料.name, line資料.picture, authUser.id)
        }
      }
    }

    同步社群Session()

    return () => {
      active = false
    }
  }, [Google登入, LINE登入])

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* 公開頁面 */}
        <Route path="/" element={<SplashPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/data-deletion" element={<DataDeletionPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/liff/verify" element={<LiffVerifyPage />} />

        {/* 公開瀏覽頁面 — 含底部導覽列，不需登入 */}
        <Route element={<AppShell />}>
          <Route path="/wall" element={<WallPage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/event/:id/share" element={<SharePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>

        {/* 需要登入的頁面 — 含底部導覽列 */}
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route path="/create" element={<CreateEventPage />} />
          <Route path="/event/:id/edit" element={<CreateEventPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        </Route>

        {/* 未知路由導向首頁 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
