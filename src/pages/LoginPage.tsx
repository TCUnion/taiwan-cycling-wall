// 登入頁面 — 支援 Facebook / Google / LINE / Strava

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { 載入FacebookSDK, FB登入, 取得粉絲頁列表 } from '../utils/facebook'
import { 載入GoogleSDK, Google登入 } from '../utils/google'
import { 發起LINE登入 } from '../utils/line'
import { 發起Strava登入 } from '../utils/strava'
import SocialLoginButton from '../components/ui/SocialLoginButton'
import { usePageMeta } from '../hooks/usePageMeta'

// 檢查環境變數是否已設定
const 有GoogleClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID
const 有LineChannelId = !!import.meta.env.VITE_LINE_CHANNEL_ID
const 有StravaClientId = !!import.meta.env.VITE_STRAVA_CLIENT_ID

export default function LoginPage() {
  const navigate = useNavigate()
  const FB登入Store = useAuthStore(s => s.FB登入)
  const Google登入Store = useAuthStore(s => s.Google登入)
  const 設定粉絲頁列表 = useAuthStore(s => s.設定粉絲頁列表)
  const [載入中Provider, set載入中Provider] = useState<string | null>(null)
  const [SDK就緒, setSDK就緒] = useState({ facebook: false, google: false })
  const [錯誤訊息, set錯誤訊息] = useState('')

  usePageMeta('登入 — 約騎公布欄', '使用 Facebook、Google、LINE 或 Strava 帳號登入約騎公布欄。')

  // 載入各 SDK
  useEffect(() => {
    載入FacebookSDK().then(() => setSDK就緒(prev => ({ ...prev, facebook: true })))
    if (有GoogleClientId) {
      載入GoogleSDK().then(() => setSDK就緒(prev => ({ ...prev, google: true })))
    }
  }, [])

  const 處理FB登入 = async () => {
    set載入中Provider('facebook')
    set錯誤訊息('')
    try {
      const 使用者資訊 = await FB登入()
      FB登入Store(使用者資訊.fbId, 使用者資訊.name, 使用者資訊.pictureUrl, 使用者資訊.countyId)
      const 粉絲頁 = await 取得粉絲頁列表()
      if (粉絲頁.length > 0) {
        設定粉絲頁列表(粉絲頁.map(p => ({ pageId: p.pageId, name: p.name, pictureUrl: p.pictureUrl })))
      }
      navigate('/wall', { replace: true })
    } catch (err) {
      console.warn('[登入] Facebook 登入失敗:', err)
      set錯誤訊息('Facebook 登入失敗，請稍後再試')
    } finally {
      set載入中Provider(null)
    }
  }

  const 處理Google登入 = async () => {
    set載入中Provider('google')
    set錯誤訊息('')
    try {
      const 使用者資訊 = await Google登入()
      Google登入Store(使用者資訊.sub, 使用者資訊.name, 使用者資訊.picture, 使用者資訊.email)
      navigate('/wall', { replace: true })
    } catch (err) {
      console.warn('[登入] Google 登入失敗:', err)
      set錯誤訊息('Google 登入失敗，請稍後再試')
    } finally {
      set載入中Provider(null)
    }
  }

  const 處理LINE登入 = () => {
    set錯誤訊息('')
    try {
      發起LINE登入()
      // redirect 後不會回到這裡
    } catch (err) {
      console.warn('[登入] LINE 登入失敗:', err)
      set錯誤訊息('LINE 登入失敗，請稍後再試')
    }
  }

  const 處理Strava登入 = () => {
    set錯誤訊息('')
    try {
      發起Strava登入()
      // redirect 後不會回到這裡
    } catch (err) {
      console.warn('[登入] Strava 登入失敗:', err)
      set錯誤訊息('Strava 登入失敗，請稍後再試')
    }
  }

  // main landmark：提升無障礙性，讓螢幕閱讀器可跳至主要內容
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-cork px-6">
      <div className="w-full max-w-sm text-center">
        {/* 標題 */}
        <h1 className="text-5xl font-black text-strava mb-2">siokiu</h1>
        <p className="text-gray-500 mb-2">相揪來騎車</p>
        <p className="text-sm text-gray-400 mb-10">約騎公布欄 — 找人一起騎車吧！</p>

        {/* 登入按鈕 */}
        <div className="flex flex-col gap-3">
          <SocialLoginButton
            provider="google"
            onClick={處理Google登入}
            disabled={!有GoogleClientId || !SDK就緒.google || 載入中Provider !== null}
            loading={載入中Provider === 'google'}
          />
          <SocialLoginButton
            provider="line"
            onClick={處理LINE登入}
            disabled={!有LineChannelId || 載入中Provider !== null}
            loading={載入中Provider === 'line'}
          />
          <div className="relative">
            <SocialLoginButton
              provider="strava"
              onClick={處理Strava登入}
              disabled={true}
              loading={false}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">尚未開放</span>
          </div>
          <div className="relative">
            <SocialLoginButton
              provider="facebook"
              onClick={處理FB登入}
              disabled={true}
              loading={false}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">尚未開放</span>
          </div>
        </div>

        {錯誤訊息 && (
          <p className="mt-4 text-sm text-red-500">{錯誤訊息}</p>
        )}

        <p className="mt-6 text-xs text-gray-400">
          登入即表示你同意我們的服務條款與
          <a href="/privacy" className="underline cursor-pointer focus-visible:ring-2 focus-visible:ring-strava/40 focus-visible:outline-none rounded">隱私政策</a>
        </p>
      </div>
    </main>
  )
}
