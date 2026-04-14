import { 取得目前AuthUserId, supabase } from './supabase'

/** 使用 crypto API 產生安全的 6 位數隨機認證碼 */
function 產生認證碼(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String(100000 + (array[0] % 900000))
}

/** 新 token 請求最短間隔（毫秒）— 防止暴力破解者快速重複請求新 token */
const 最短請求間隔ms = 2 * 60 * 1000 // 2 分鐘

function 驗證紀錄擁有者條件查詢<T extends {
  eq: (column: string, value: string) => T
  or: (filters: string) => T
}>(query: T, userId: string, authUserId: string | null): T {
  if (authUserId) {
    return query.or(`auth_user_id.eq.${authUserId},user_id.eq.${userId}`)
  }
  return query.eq('user_id', userId)
}

/** 建立認證請求：檢查速率限制 → 產生 token → 存入 Supabase */
export async function 建立認證請求(userId: string): Promise<{ token: string; expiresAt: string } | null> {
  const authUserId = await 取得目前AuthUserId()

  // 速率限制：檢查最近一筆請求（不論狀態），防止快速重複請求
  const recentQuery = supabase
    .from('user_verifications')
    .select('id, created_at, status, expires_at')
    .order('created_at', { ascending: false })
    .limit(1)
  const { data: recent } = await 驗證紀錄擁有者條件查詢(recentQuery, userId, authUserId)

  if (recent && recent.length > 0) {
    const 上次建立時間 = new Date(recent[0].created_at).getTime()
    const 經過時間 = Date.now() - 上次建立時間

    // 冷卻時間未到 → 拒絕建立新 token
    if (經過時間 < 最短請求間隔ms) {
      const 剩餘秒 = Math.ceil((最短請求間隔ms - 經過時間) / 1000)
      console.warn(`[認證] 請求過於頻繁，請等待 ${剩餘秒} 秒`)
      return null
    }

    // 將舊的 pending 請求標記為過期
    if (recent[0].status === 'pending') {
      const expireQuery = supabase
        .from('user_verifications')
        .update({ status: 'expired' })
        .eq('status', 'pending')
      await 驗證紀錄擁有者條件查詢(expireQuery, userId, authUserId)
    }
  }

  const token = 產生認證碼()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 分鐘效期

  const { error } = await supabase
    .from('user_verifications')
    .insert({
      user_id: userId,
      auth_user_id: authUserId,
      token,
      status: 'pending',
      expires_at: expiresAt,
    })

  if (error) {
    console.warn('[認證] 建立認證請求失敗:', error.message)
    return null
  }

  return { token, expiresAt }
}

/** 每個 token 最多允許的驗證嘗試次數 */
const 最大嘗試次數 = 5

/** 驗證認證碼：比對 token + 綁定 user_id + 更新狀態（含暴力破解防護） */
export async function 驗證認證碼(token: string, lineUserId: string): Promise<{ success: boolean; message: string; remainingAttempts?: number }> {
  // 基本格式驗證
  if (!/^\d{6}$/.test(token)) {
    return { success: false, message: '認證碼格式錯誤' }
  }

  // 查找 pending 且未過期的 token
  const { data, error } = await supabase
    .from('user_verifications')
    .select('id,user_id,auth_user_id,expires_at,attempts,status')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (error || !data) {
    return { success: false, message: '認證碼無效或已使用' }
  }

  // 檢查是否過期
  if (new Date(data.expires_at) < new Date()) {
    await supabase
      .from('user_verifications')
      .update({ status: 'expired' })
      .eq('id', data.id)
    return { success: false, message: '認證碼已過期，請重新申請' }
  }

  // 暴力破解防護：檢查嘗試次數
  const 目前嘗試次數 = (data.attempts ?? 0) as number
  if (目前嘗試次數 >= 最大嘗試次數) {
    // 超過次數上限 → 自動過期此 token
    await supabase
      .from('user_verifications')
      .update({ status: 'expired' })
      .eq('id', data.id)
    return { success: false, message: '嘗試次數過多，認證碼已失效，請重新申請' }
  }

  // 遞增嘗試次數（無論後續驗證是否成功，都先記錄此次嘗試）
  await supabase
    .from('user_verifications')
    .update({ attempts: 目前嘗試次數 + 1 })
    .eq('id', data.id)

  // 檢查此 LINE 帳號是否已認證過其他約騎帳號
  const { data: existingVerified } = await supabase
    .from('user_verifications')
    .select('user_id')
    .eq('line_user_id', lineUserId)
    .eq('status', 'verified')
    .limit(1)

  if (existingVerified && existingVerified.length > 0) {
    const 剩餘次數 = 最大嘗試次數 - (目前嘗試次數 + 1)
    return { success: false, message: '此 LINE 帳號已認證過其他帳號', remainingAttempts: 剩餘次數 }
  }

  const now = new Date().toISOString()

  // 更新 verification 記錄
  const { error: updateError } = await supabase
    .from('user_verifications')
    .update({
      status: 'verified',
      line_user_id: lineUserId,
      verified_at: now,
    })
    .eq('id', data.id)

  if (updateError) {
    return { success: false, message: '更新認證狀態失敗' }
  }

  // 更新 users 表：優先以 auth_user_id 命中，fallback 到 legacy user_id
  if (data.auth_user_id) {
    await supabase
      .from('users')
      .update({
        verified_at: now,
        line_verified_user_id: lineUserId,
      })
      .eq('auth_user_id', data.auth_user_id)
  } else {
    await supabase
      .from('users')
      .update({
        verified_at: now,
        line_verified_user_id: lineUserId,
      })
      .eq('id', data.user_id)
  }

  return { success: true, message: '認證成功！' }
}

/** 查詢認證狀態（輪詢用） */
export async function 查詢認證狀態(token: string): Promise<'pending' | 'verified' | 'expired' | 'not_found'> {
  if (!/^\d{6}$/.test(token)) return 'not_found'

  const { data, error } = await supabase
    .from('user_verifications')
    .select('status, expires_at')
    .eq('token', token)
    .single()

  if (error || !data) return 'not_found'

  // 若 pending 但已過期，自動標記
  if (data.status === 'pending' && new Date(data.expires_at) < new Date()) {
    await supabase
      .from('user_verifications')
      .update({ status: 'expired' })
      .eq('token', token)
    return 'expired'
  }

  return data.status as 'pending' | 'verified' | 'expired'
}
