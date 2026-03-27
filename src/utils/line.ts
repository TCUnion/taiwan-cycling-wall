// LINE Login 工具（OAuth 2.0 + PKCE）
// 流程：redirect → LINE 授權 → 回調帶 code → 前端用 code 換 token → 解碼 id_token

import { 產生PKCE, 產生State } from './pkce'

const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID as string
const REDIRECT_URI = import.meta.env.VITE_OAUTH_REDIRECT_URI as string

const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize'
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token'

/** LINE id_token 解碼後的使用者資訊 */
export interface LINEUserInfo {
  sub: string       // LINE 使用者 ID
  name: string
  picture: string
}

/** 發起 LINE 登入（redirect 到 LINE） */
export async function 發起LINE登入(): Promise<void> {
  if (!LINE_CHANNEL_ID) {
    throw new Error('尚未設定 LINE Channel ID')
  }

  const { codeVerifier, codeChallenge } = await 產生PKCE()
  const state = 產生State()

  // 暫存 PKCE verifier 和 state 供回調時使用
  sessionStorage.setItem('line_code_verifier', codeVerifier)
  sessionStorage.setItem('line_state', state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_CHANNEL_ID,
    redirect_uri: REDIRECT_URI,
    state,
    scope: 'profile openid',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${LINE_AUTH_URL}?${params.toString()}`
}

/** 處理 LINE 回調（用 authorization code 換取 token） */
export async function 處理LINE回調(code: string, state: string): Promise<LINEUserInfo> {
  // 驗證 state
  const 預期State = sessionStorage.getItem('line_state')
  if (state !== 預期State) {
    throw new Error('LINE 登入驗證失敗（state 不符）')
  }

  const codeVerifier = sessionStorage.getItem('line_code_verifier')
  if (!codeVerifier) {
    throw new Error('LINE 登入驗證失敗（缺少 code_verifier）')
  }

  // 清除暫存
  sessionStorage.removeItem('line_state')
  sessionStorage.removeItem('line_code_verifier')

  // 用 code 換 token
  const tokenResponse = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: LINE_CHANNEL_ID,
      code_verifier: codeVerifier,
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('LINE token 交換失敗')
  }

  const tokenData = await tokenResponse.json()
  const idToken = tokenData.id_token as string

  if (!idToken) {
    throw new Error('LINE 未回傳 id_token')
  }

  // 解碼 id_token 取得使用者資訊（正確處理 UTF-8 中文名）
  const base64 = idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
  const jsonStr = decodeURIComponent(
    atob(padded).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  )
  const payload = JSON.parse(jsonStr)

  return {
    sub: payload.sub,
    name: payload.name || '未命名',
    picture: payload.picture || '',
  }
}
