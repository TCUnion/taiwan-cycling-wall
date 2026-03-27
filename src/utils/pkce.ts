// PKCE（Proof Key for Code Exchange）工具函式
// 用於 LINE Login 等 OAuth 2.0 + PKCE 流程

/** 產生指定長度的隨機字串（URL-safe） */
export function 產生隨機字串(長度 = 43): string {
  const 字元集 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const 隨機陣列 = crypto.getRandomValues(new Uint8Array(長度))
  return Array.from(隨機陣列, (位元) => 字元集[位元 % 字元集.length]).join('')
}

/** 將字串轉為 SHA-256 雜湊後 base64url 編碼 */
export async function SHA256Base64url(明文: string): Promise<string> {
  const 編碼器 = new TextEncoder()
  const 雜湊 = await crypto.subtle.digest('SHA-256', 編碼器.encode(明文))
  const base64 = btoa(String.fromCharCode(...new Uint8Array(雜湊)))
  // base64 → base64url（替換 + / = 為 URL-safe 字元）
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** 產生 PKCE code_verifier + code_challenge */
export async function 產生PKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = 產生隨機字串(43)
  const codeChallenge = await SHA256Base64url(codeVerifier)
  return { codeVerifier, codeChallenge }
}

/** 產生隨機 state 參數（防 CSRF） */
export function 產生State(): string {
  return 產生隨機字串(32)
}
