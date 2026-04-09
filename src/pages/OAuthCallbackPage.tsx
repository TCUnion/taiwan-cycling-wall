// OAuth 回調頁面 — LINE / Strava 共用
// 從 URL query params 判斷 provider，執行 token 交換後登入

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../utils/supabase'
import { 處理Strava回調 } from '../utils/strava'
import { 淨化純文字 } from '../utils/sanitize'
import { 綁定GoogleAuth使用者, 綁定LINEAuth使用者 } from '../utils/userService'

function 取得Google登入資料(authUser: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
  identities?: Array<{ provider?: string; identity_data?: Record<string, unknown> }>
}) {
  const metadata = authUser.user_metadata as Record<string, unknown> | undefined
  const identities = authUser.identities ?? []
  const googleIdentity = identities.find(identity => identity.provider === 'google')

  if (!googleIdentity && !metadata?.sub && !metadata?.provider_id && !authUser.email) {
    return null
  }

  return {
    googleSub: (
      googleIdentity?.identity_data?.sub
      ?? metadata?.sub
      ?? metadata?.provider_id
      ?? authUser.id
    ) as string,
    name: (
      metadata?.full_name
      ?? metadata?.name
      ?? (authUser.email ? authUser.email.split('@')[0] : 'Google 使用者')
    ) as string,
    picture: (metadata?.avatar_url ?? metadata?.picture ?? '') as string,
    email: authUser.email ?? (metadata?.email as string | undefined) ?? '',
  }
}

function 取得LINE登入資料(authUser: {
  id: string
  email?: string | null
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

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [錯誤訊息, set錯誤訊息] = useState('')
  const Google登入 = useAuthStore(s => s.Google登入)
  const LINE登入 = useAuthStore(s => s.LINE登入)
  const Strava登入 = useAuthStore(s => s.Strava登入)

  useEffect(() => {
    let 已交換Code = false

    const 處理GoogleSession登入 = async (authUser: {
      id: string
      email?: string | null
      user_metadata?: Record<string, unknown>
      identities?: Array<{ provider?: string; identity_data?: Record<string, unknown> }>
    }) => {
      const google資料 = 取得Google登入資料(authUser)

      if (!google資料) {
        throw new Error('找不到 Google 身分資料，請重新登入')
      }

      await 綁定GoogleAuth使用者({
        authUserId: authUser.id,
        googleSub: google資料.googleSub,
        email: google資料.email,
        name: google資料.name,
        avatar: google資料.picture,
      })

      Google登入(google資料.googleSub, google資料.name, google資料.picture, google資料.email, authUser.id)
      navigate('/wall', { replace: true })
    }

    const 處理LINESession登入 = async (authUser: {
      id: string
      email?: string | null
      user_metadata?: Record<string, unknown>
      app_metadata?: Record<string, unknown>
      identities?: Array<{ provider?: string; identity_data?: Record<string, unknown> }>
    }) => {
      const line資料 = 取得LINE登入資料(authUser)

      if (!line資料) {
        throw new Error('找不到 LINE 身分資料，請重新登入')
      }

      const 綁定結果 = await 綁定LINEAuth使用者({
        authUserId: authUser.id,
        lineUserId: line資料.lineUserId,
        name: line資料.name,
        avatar: line資料.picture,
      })

      if (!綁定結果?.authUserId) {
        throw new Error(`LINE 帳號綁定失敗：public.users 未寫入 auth_user_id（line_user_id=${line資料.lineUserId}）`)
      }

      LINE登入(line資料.lineUserId, line資料.name, line資料.picture, authUser.id)
      navigate('/wall', { replace: true })
    }

    const 處理回調 = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')
      const provider = searchParams.get('provider')

      if (error) {
        set錯誤訊息(`登入取消或失敗：${淨化純文字(error)}`)
        return
      }

      try {
        const 是StravaState = !!state?.startsWith('strava-')

        if (code && !是StravaState && !已交換Code) {
          const { data: 現有Session資料 } = await supabase.auth.getSession()
          if (!現有Session資料.session) {
            已交換Code = true
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            if (exchangeError) {
              throw new Error(exchangeError.message || 'OAuth code 交換 session 失敗')
            }
          }
        }

        if (provider === 'google') {
          const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] = await Promise.all([
            supabase.auth.getSession(),
            supabase.auth.getUser(),
          ])

          if (sessionError || userError) {
            throw new Error(sessionError?.message || userError?.message || 'Google 登入處理失敗')
          }

          if (!sessionData.session || !userData.user) {
            throw new Error('找不到 Google 登入 session，請重新登入')
          }

          await 處理GoogleSession登入(userData.user as typeof userData.user & {
            identities?: Array<{ provider?: string; identity_data?: Record<string, unknown> }>
          })
          return
        }

        if (provider === 'line') {
          const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] = await Promise.all([
            supabase.auth.getSession(),
            supabase.auth.getUser(),
          ])

          if (sessionError || userError) {
            throw new Error(sessionError?.message || userError?.message || 'LINE 登入處理失敗')
          }

          if (!sessionData.session || !userData.user) {
            throw new Error('找不到 LINE 登入 session，請重新登入')
          }

          await 處理LINESession登入(userData.user as typeof userData.user & {
            app_metadata?: Record<string, unknown>
            identities?: Array<{ provider?: string; identity_data?: Record<string, unknown> }>
          })
          return
        }

        const [{ data: sessionData }, { data: userData }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ])

        if (sessionData.session && userData.user) {
          const authUser = userData.user as typeof userData.user & {
            app_metadata?: Record<string, unknown>
            identities?: Array<{ provider?: string; identity_data?: Record<string, unknown> }>
          }

          const line資料 = 取得LINE登入資料(authUser)
          if (line資料) {
            await 處理LINESession登入(authUser)
            return
          }

          const google資料 = 取得Google登入資料(authUser)
          if (google資料) {
            await 處理GoogleSession登入(authUser)
            return
          }
        }

        if (!code || !state) {
          set錯誤訊息('缺少必要的登入參數')
          return
        }

        // 判斷來源：優先用 state 前綴（跨瀏覽器可靠），備援用 localStorage / sessionStorage
        const 是Strava = state.startsWith('strava-') || localStorage.getItem('strava_oauth_state') !== null || sessionStorage.getItem('strava_state') !== null

        if (是Strava) {
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
  }, [searchParams, navigate, Google登入, LINE登入, Strava登入])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-cork px-6">
      {錯誤訊息 ? (
        <div className="text-center">
          <p className="text-red-600 mb-4">{錯誤訊息}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="text-strava underline cursor-pointer focus-visible:ring-2 focus-visible:ring-strava/40 focus-visible:outline-none rounded"
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
