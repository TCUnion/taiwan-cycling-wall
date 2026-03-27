// OAuth 回調頁面 — LINE / Strava 共用
// 從 URL query params 判斷 provider，執行 token 交換後登入

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { 處理LINE回調 } from '../utils/line'
import { 處理Strava回調 } from '../utils/strava'
import { 淨化純文字 } from '../utils/sanitize'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [錯誤訊息, set錯誤訊息] = useState('')
  const LINE登入 = useAuthStore(s => s.LINE登入)
  const Strava登入 = useAuthStore(s => s.Strava登入)

  useEffect(() => {
    const 處理回調 = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      if (error) {
        set錯誤訊息(`登入取消或失敗：${淨化純文字(error)}`)
        return
      }

      if (!code || !state) {
        set錯誤訊息('缺少必要的登入參數')
        return
      }

      try {
        // 依據 sessionStorage 中的 state key 判斷來源
        const 是LINE = sessionStorage.getItem('line_state') !== null
        const 是Strava = sessionStorage.getItem('strava_state') !== null

        if (是LINE) {
          const 使用者 = await 處理LINE回調(code, state)
          LINE登入(使用者.sub, 使用者.name, 使用者.picture)
          navigate('/wall', { replace: true })
        } else if (是Strava) {
          const 使用者 = await 處理Strava回調(code, state)
          Strava登入(
            使用者.athleteId,
            使用者.name,
            使用者.pictureUrl,
            使用者.city,
            {
              athleteId: 使用者.athleteId,
              username: 使用者.username,
              city: 使用者.city,
              country: '',
              premium: 使用者.premium,
              accessToken: 使用者.accessToken,
            }
          )
          navigate('/wall', { replace: true })
        } else {
          set錯誤訊息('無法判斷登入來源，請重新登入')
        }
      } catch (err) {
        set錯誤訊息(err instanceof Error ? err.message : '登入處理失敗')
      }
    }

    處理回調()
  }, [searchParams, navigate, LINE登入, Strava登入])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-cork px-6">
      {錯誤訊息 ? (
        <div className="text-center">
          <p className="text-red-600 mb-4">{錯誤訊息}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="text-strava underline cursor-pointer"
          >
            返回登入頁
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-strava" />
          <p className="text-gray-600">正在處理登入…</p>
        </div>
      )}
    </div>
  )
}
