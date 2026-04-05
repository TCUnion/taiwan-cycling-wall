import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

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
