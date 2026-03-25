import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { 是否預渲染, 觸發預渲染就緒 } from './utils/prerender'
import AppShell from './components/layout/AppShell'

// 延遲載入頁面
const SplashPage = lazy(() => import('./pages/SplashPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const WallPage = lazy(() => import('./pages/WallPage'))
const CreateEventPage = lazy(() => import('./pages/CreateEventPage'))
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'))
const SharePage = lazy(() => import('./pages/SharePage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

// 載入中畫面
function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-cork">
      <div className="text-4xl animate-bounce">🚴</div>
    </div>
  )
}

// 需要登入的路由保護（預渲染時放行）
function RequireAuth({ children }: { children: React.ReactNode }) {
  const 已登入 = useAuthStore(s => s.已登入)
  if (!已登入 && !是否預渲染) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  useEffect(() => {
    // 通知預渲染器頁面已就緒
    觸發預渲染就緒()
  }, [])

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* 公開頁面 */}
        <Route path="/" element={<SplashPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 需要登入的頁面 — 含底部導覽列 */}
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route path="/wall" element={<WallPage />} />
          <Route path="/create" element={<CreateEventPage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/event/:id/share" element={<SharePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* 未知路由導向首頁 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
