import { supabase } from './supabase'

/** 產生 6 位數隨機認證碼 */
function 產生認證碼(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/** 建立認證請求：產生 token 存入 Supabase，回傳 token + 過期時間 */
export async function 建立認證請求(userId: string): Promise<{ token: string; expiresAt: string } | null> {
  const token = 產生認證碼()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 分鐘效期

  const { error } = await supabase
    .from('user_verifications')
    .insert({
      user_id: userId,
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

/** 驗證認證碼：比對 token + 更新狀態 + 更新 users 表 */
export async function 驗證認證碼(token: string, lineUserId: string): Promise<{ success: boolean; message: string }> {
  // 查找 pending 且未過期的 token
  const { data, error } = await supabase
    .from('user_verifications')
    .select('*')
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

  // 更新 users 表
  await supabase
    .from('users')
    .update({
      verified_at: now,
      line_verified_user_id: lineUserId,
    })
    .eq('id', data.user_id)

  return { success: true, message: '認證成功！' }
}

/** 查詢認證狀態（輪詢用） */
export async function 查詢認證狀態(token: string): Promise<'pending' | 'verified' | 'expired' | 'not_found'> {
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
