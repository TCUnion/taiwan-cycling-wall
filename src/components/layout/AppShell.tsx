import { Outlet } from 'react-router-dom'
import BottomNavBar from './BottomNavBar'

export default function AppShell() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* 主要內容區域，底部留空給導覽列 */}
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <BottomNavBar />
    </div>
  )
}
