import { Outlet } from 'react-router-dom'
import BottomNavBar from './BottomNavBar'

export default function AppShell() {
  return (
    <div className="flex min-h-svh flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-strava">
        跳至主要內容
      </a>
      {/* 主要內容區域，底部留空給導覽列 */}
      <main id="main-content" className="flex-1 pb-16">
        <Outlet />
      </main>
      <BottomNavBar />
    </div>
  )
}
