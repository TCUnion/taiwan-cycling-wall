// 社群登入按鈕元件 — 各平台 SVG logo + 品牌色

import { Loader2 } from 'lucide-react'
import type { AuthProvider } from '../../types'

interface SocialLoginButtonProps {
  provider: AuthProvider
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

// 各平台 SVG icon
const 平台圖示: Record<AuthProvider, React.ReactNode> = {
  facebook: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  ),
  line: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386a.63.63 0 01-.63-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596a.625.625 0 01-.22.04.636.636 0 01-.516-.27l-2.443-3.317v2.951a.63.63 0 01-1.26 0V8.108a.631.631 0 011.168-.334l2.444 3.32V8.108c0-.345.282-.63.63-.63.349 0 .63.285.63.63v4.771zm-6.205 0a.63.63 0 01-1.26 0V8.108c0-.345.282-.63.63-.63.349 0 .63.285.63.63v4.771zm-2.118.629H4.802a.63.63 0 01-.63-.629V8.108c0-.345.282-.63.63-.63.348 0 .63.285.63.63v4.141h1.755c.349 0 .63.283.63.63 0 .344-.282.629-.63.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  ),
  strava: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  ),
}

// 各平台按鈕樣式
const 平台樣式: Record<AuthProvider, string> = {
  facebook: '!bg-[#1877F2] hover:!bg-[#166FE5] active:!bg-[#1565D8] !text-white',
  google: '!bg-white hover:!bg-gray-50 active:!bg-gray-100 !text-gray-700 !border !border-gray-300',
  line: '!bg-[#00B900] hover:!bg-[#00A800] active:!bg-[#009700] !text-white',
  strava: '!bg-[#FC4C02] hover:!bg-[#E54400] active:!bg-[#CC3D00] !text-white',
}

const 平台名稱: Record<AuthProvider, string> = {
  facebook: 'Facebook',
  google: 'Google',
  line: 'LINE',
  strava: 'Strava',
}

export default function SocialLoginButton({ provider, onClick, disabled, loading }: SocialLoginButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex w-full items-center justify-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium
        transition-colors duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400
        ${平台樣式[provider]}
      `}
      aria-label={`使用 ${平台名稱[provider]} 登入`}
    >
      {loading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        平台圖示[provider]
      )}
      {loading ? '登入中…' : `使用 ${平台名稱[provider]} 登入`}
    </button>
  )
}
