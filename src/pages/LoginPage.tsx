// 登入頁面 — Facebook 登入

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { 載入FacebookSDK, FB登入, 取得粉絲頁列表 } from '../utils/facebook'
import Button from '../components/ui/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const FB登入Store = useAuthStore(s => s.FB登入)
  const 設定粉絲頁列表 = useAuthStore(s => s.設定粉絲頁列表)
  const [載入中, set載入中] = useState(false)
  const [SDK就緒, setSDK就緒] = useState(false)
  const [錯誤訊息, set錯誤訊息] = useState('')

  // 載入 Facebook SDK
  useEffect(() => {
    載入FacebookSDK().then(() => setSDK就緒(true))
  }, [])

  const 處理FB登入 = async () => {
    set載入中(true)
    set錯誤訊息('')
    try {
      const 使用者資訊 = await FB登入()
      FB登入Store(使用者資訊.fbId, 使用者資訊.name, 使用者資訊.pictureUrl, 使用者資訊.countyId)
      // 登入後取得管理的粉絲頁（pages_show_list 未授權時回傳空陣列）
      const 粉絲頁 = await 取得粉絲頁列表()
      if (粉絲頁.length > 0) {
        設定粉絲頁列表(粉絲頁.map(p => ({ pageId: p.pageId, name: p.name, pictureUrl: p.pictureUrl })))
      }
      navigate('/wall', { replace: true })
    } catch (err) {
      set錯誤訊息(err instanceof Error ? err.message : '登入失敗，請稍後再試')
    } finally {
      set載入中(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-cork px-6">
      <div className="w-full max-w-sm text-center">
        {/* 標題 */}
        <h1 className="text-5xl font-black text-strava mb-2">siokiu</h1>
        <p className="text-gray-500 mb-2">相揪來騎車</p>
        <p className="text-sm text-gray-400 mb-10">約騎公布欄 — 找人一起騎車吧！</p>

        {/* Facebook 登入按鈕 */}
        <Button
          fullWidth
          size="lg"
          onClick={處理FB登入}
          disabled={!SDK就緒 || 載入中}
          className="!bg-[#1877F2] hover:!bg-[#166FE5] active:!bg-[#1565D8] !text-white"
        >
          {載入中 ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
          )}
          {載入中 ? '登入中...' : '使用 Facebook 登入'}
        </Button>

        {錯誤訊息 && (
          <p className="mt-4 text-sm text-red-500">{錯誤訊息}</p>
        )}

        <p className="mt-6 text-xs text-gray-400">
          登入即表示你同意我們的服務條款與隱私政策
        </p>
      </div>
    </div>
  )
}
