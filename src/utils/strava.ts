// Strava OAuth 登入工具
// 流程：redirect → Strava 授權 → 回調帶 code → POST 到 n8n webhook → 取得使用者資訊

import { 產生State } from './pkce'

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID as string
const STRAVA_CALLBACK_URL = import.meta.env.VITE_STRAVA_CALLBACK_URL as string
const REDIRECT_URI = import.meta.env.VITE_OAUTH_REDIRECT_URI as string

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize'

/** Strava 使用者資訊（從 n8n 回傳） */
export interface StravaUserInfo {
  athleteId: number
  name: string
  pictureUrl: string
  city: string
  username?: string
  premium: boolean
  accessToken: string
}

/** 發起 Strava 登入（redirect 到 Strava） */
export function 發起Strava登入(): void {
  if (!STRAVA_CLIENT_ID) {
    throw new Error('尚未設定 Strava Client ID')
  }

  const state = `strava-${產生State()}`
  sessionStorage.setItem('strava_state', state)

  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'read,activity:read',
    state,
    approval_prompt: 'auto',
  })

  window.location.href = `${STRAVA_AUTH_URL}?${params.toString()}`
}

/** 處理 Strava 回調（透過 n8n 後端換 token） */
export async function 處理Strava回調(code: string, state: string): Promise<StravaUserInfo> {
  // 驗證 state（sessionStorage 可能因瀏覽器切換而遺失）
  const 預期State = sessionStorage.getItem('strava_state')
  if (預期State && state !== 預期State) {
    throw new Error('Strava 登入驗證失敗（state 不符）')
  }
  if (!預期State && !state.startsWith('strava-')) {
    throw new Error('Strava 登入驗證失敗（state 來源不明）')
  }
  sessionStorage.removeItem('strava_state')

  if (!STRAVA_CALLBACK_URL) {
    throw new Error('尚未設定 Strava callback URL')
  }

  // 將 code 送到 n8n 後端進行 token 交換
  const response = await fetch(STRAVA_CALLBACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })

  if (!response.ok) {
    throw new Error('Strava 登入失敗（後端處理錯誤）')
  }

  const data = await response.json()

  // n8n 回傳的 Strava athlete 資訊
  const athlete = data.athlete || data
  return {
    athleteId: athlete.id,
    name: `${athlete.firstname || ''} ${athlete.lastname || ''}`.trim() || '未命名',
    pictureUrl: athlete.profile || athlete.profile_medium || '',
    city: athlete.city || '',
    username: athlete.username,
    premium: athlete.premium || false,
    accessToken: data.access_token || '',
  }
}
