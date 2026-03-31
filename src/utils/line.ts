// LINE Login 工具（OAuth 2.0 + PKCE）
// 流程：redirect → LINE 授權 → 回調帶 code → 前端用 code 換 token → 解碼 id_token
// 注意：使用 localStorage 而非 sessionStorage，因為 iOS 上 Safari→LINE App→Chrome 會跨瀏覽器

import { 產生PKCE, 產生State } from './pkce'

const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID as string
const REDIRECT_URI = import.meta.env.VITE_OAUTH_REDIRECT_URI as string

const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize'
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token'

// localStorage key（含過期時間）
const LS_STATE = 'line_oauth_state'
const LS_VERIFIER = 'line_oauth_verifier'
const LS_EXPIRES = 'line_oauth_expires'
const OAUTH_TTL_MS = 10 * 60 * 1000 // 10 分鐘過期

/** 儲存 OAuth 暫存資料到 localStorage（附過期時間） */
function 儲存OAuth資料(state: string, verifier: string) {
  localStorage.setItem(LS_STATE, state)
  localStorage.setItem(LS_VERIFIER, verifier)
  localStorage.setItem(LS_EXPIRES, String(Date.now() + OAUTH_TTL_MS))
}

/** 讀取並清除 OAuth 暫存資料（過期則視為不存在） */
function 讀取OAuth資料(): { state: string; verifier: string } | null {
  const expires = localStorage.getItem(LS_EXPIRES)
  if (expires && Date.now() > Number(expires)) {
    清除OAuth資料()
    return null
  }
  const state = localStorage.getItem(LS_STATE)
  const verifier = localStorage.getItem(LS_VERIFIER)
  if (!state || !verifier) return null
  return { state, verifier }
}

function 清除OAuth資料() {
  localStorage.removeItem(LS_STATE)
  localStorage.removeItem(LS_VERIFIER)
  localStorage.removeItem(LS_EXPIRES)
}

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
  const state = `line-${產生State()}`

  // 儲存到 localStorage（跨瀏覽器切換時仍可讀取）
  儲存OAuth資料(state, codeVerifier)

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
  // 從 localStorage 讀取（優先）或 sessionStorage（舊版相容）
  const oauth = 讀取OAuth資料()
  const 預期State = oauth?.state ?? sessionStorage.getItem('line_state')
  const codeVerifier = oauth?.verifier ?? sessionStorage.getItem('line_code_verifier')

  // 驗證 state（無 預期State 時直接拒絕，避免 prefix-only fallback CSRF 缺口）
  if (!預期State) {
    清除OAuth資料()
    throw new Error('登入資料已過期，請返回重新登入')
  }
  if (state !== 預期State) {
    清除OAuth資料()
    throw new Error('LINE 登入驗證失敗（state 不符）')
  }

  if (!codeVerifier) {
    清除OAuth資料()
    throw new Error('登入資料已過期，請返回重新登入')
  }

  // 清除所有暫存
  清除OAuth資料()
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
