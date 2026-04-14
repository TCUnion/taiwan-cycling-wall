import { supabase } from './supabase'
import type { User } from '../types'

// 使用者查詢共用欄位（避免 10+ 處重複長字串）
const USER_SELECT = 'id,auth_user_id,name,avatar,county_id,auth_provider,email,google_sub,line_user_id,strava_profile,managed_pages,stamp_image,stamp_images,social_avatar,stats,verified_at,line_verified_user_id,merged_into,role'

// 前端 User → DB row（camelCase → snake_case）
function toDbRow(user: User) {
  return {
    id: user.id,
    auth_user_id: user.authUserId ?? null,
    legacy_user_id: user.id,
    name: user.name,
    avatar: user.avatar,
    county_id: user.countyId,
    auth_provider: user.authProvider ?? null,
    email: user.email ?? null,
    google_sub: user.googleSub ?? null,
    line_user_id: user.lineUserId ?? null,
    strava_profile: user.stravaProfile ?? null,
    managed_pages: user.managedPages ?? [],
    stamp_image: user.stampImage ?? null,
    stamp_images: JSON.stringify(user.stampImages ?? []),
    social_avatar: user.socialAvatar ?? null,
    stats: user.stats,
    verified_at: user.verifiedAt ?? null,
    line_verified_user_id: user.lineVerifiedUserId ?? null,
    merged_into: user.mergedInto ?? null,
    updated_at: new Date().toISOString(),
  }
}

// DB row → 前端 User（snake_case → camelCase）
function fromDbRow(row: Record<string, unknown>): Partial<User> {
  return {
    id: row.id as string,
    authUserId: row.auth_user_id as string | undefined,
    name: row.name as string,
    avatar: (row.avatar as string) ?? '',
    countyId: (row.county_id as string) ?? '',
    authProvider: row.auth_provider as User['authProvider'],
    email: row.email as string | undefined,
    googleSub: row.google_sub as string | undefined,
    lineUserId: row.line_user_id as string | undefined,
    stravaProfile: row.strava_profile as User['stravaProfile'],
    managedPages: (row.managed_pages as User['managedPages']) ?? [],
    stampImage: row.stamp_image as string | undefined,
    stampImages: (() => {
      // 優先用 stamp_images，fallback 到 stamp_image（向後相容）
      try {
        const arr = JSON.parse((row.stamp_images as string) || '[]')
        if (Array.isArray(arr) && arr.length > 0) return arr as string[]
      } catch {
        // ignore invalid legacy JSON payloads
      }
      const single = row.stamp_image as string | undefined
      return single ? [single] : []
    })(),
    socialAvatar: row.social_avatar as string | undefined,
    stats: row.stats as User['stats'],
    verifiedAt: row.verified_at as string | undefined,
    lineVerifiedUserId: row.line_verified_user_id as string | undefined,
    mergedInto: row.merged_into as string | undefined,
    role: (row.role as string) ?? 'unverified',
  }
}

/** 從 Supabase 取得使用者 */
export async function 取得使用者(id: string): Promise<Partial<User> | null> {
  const { data, error } = await supabase
    .from('users')
    .select(USER_SELECT)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return fromDbRow(data)
}

/** Upsert 使用者（有則更新、無則新增） */
export async function upsert使用者(user: User): Promise<void> {
  const { error } = await supabase
    .from('users')
    .upsert(toDbRow(user), { onConflict: 'id' })

  if (error) {
    console.warn('[Supabase] upsert 使用者失敗:', error.message)
  }
}

/** Google Supabase Auth 登入後，將 auth.users.id 綁回既有 public.users */
export async function 綁定GoogleAuth使用者(params: {
  authUserId: string
  googleSub: string
  email?: string
  name: string
  avatar?: string
}): Promise<Partial<User> | null> {
  const email = params.email?.toLowerCase().trim()

  let row: Record<string, unknown> | null = null

  const { data: byGoogleSub } = await supabase
    .from('users')
    .select(USER_SELECT)
    .eq('google_sub', params.googleSub)
    .maybeSingle()

  row = (byGoogleSub as Record<string, unknown> | null) ?? null

  if (!row && email) {
    const { data: byEmail } = await supabase
      .from('users')
      .select(USER_SELECT)
      .eq('email', email)
      .maybeSingle()
    row = (byEmail as Record<string, unknown> | null) ?? null
  }

  if (!row) {
    const newRow = {
      id: `google-${params.googleSub}`,
      auth_user_id: params.authUserId,
      legacy_user_id: `google-${params.googleSub}`,
      name: params.name,
      avatar: params.avatar ?? '',
      social_avatar: params.avatar ?? null,
      auth_provider: 'google',
      email: email ?? null,
      google_sub: params.googleSub,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(newRow, { onConflict: 'id' })
      .select(USER_SELECT)
      .single()

    if (error || !data) {
      console.warn('[Supabase] 綁定 Google Auth 使用者失敗:', error?.message)
      return null
    }

    return fromDbRow(data)
  }

  const updates = {
    auth_user_id: params.authUserId,
    auth_provider: 'google',
    email: email ?? ((row.email as string | undefined) ?? null),
    google_sub: params.googleSub,
    name: params.name || (row.name as string) || '',
    avatar: params.avatar ?? ((row.avatar as string | undefined) ?? ''),
    social_avatar: params.avatar ?? ((row.social_avatar as string | undefined) ?? null),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', row.id as string)
    .select(USER_SELECT)
    .single()

  if (error || !data) {
    console.warn('[Supabase] 更新 Google Auth 綁定失敗:', error?.message)
    return row ? fromDbRow(row) : null
  }

  return fromDbRow(data)
}

export async function 綁定LINEAuth使用者(params: {
  authUserId: string
  lineUserId: string
  name: string
  avatar?: string
}): Promise<Partial<User> | null> {
  let row: Record<string, unknown> | null = null

  const { data: byLineUserId } = await supabase
    .from('users')
    .select(USER_SELECT)
    .eq('line_user_id', params.lineUserId)
    .maybeSingle()

  row = (byLineUserId as Record<string, unknown> | null) ?? null

  if (!row) {
    const newRow = {
      id: `line-${params.lineUserId}`,
      auth_user_id: params.authUserId,
      legacy_user_id: `line-${params.lineUserId}`,
      name: params.name,
      avatar: params.avatar ?? '',
      social_avatar: params.avatar ?? null,
      auth_provider: 'line',
      line_user_id: params.lineUserId,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(newRow, { onConflict: 'id' })
      .select(USER_SELECT)
      .single()

    if (error || !data) {
      console.warn('[Supabase] 綁定 LINE Auth 使用者失敗:', error?.message)
      return null
    }

    return fromDbRow(data)
  }

  const updates = {
    auth_user_id: params.authUserId,
    auth_provider: 'line',
    line_user_id: params.lineUserId,
    name: params.name || (row.name as string) || '',
    avatar: params.avatar ?? ((row.avatar as string | undefined) ?? ''),
    social_avatar: params.avatar ?? ((row.social_avatar as string | undefined) ?? null),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', row.id as string)
    .select(USER_SELECT)
    .single()

  if (error || !data) {
    console.warn('[Supabase] 更新 LINE Auth 綁定失敗:', error?.message)
    return row ? fromDbRow(row) : null
  }

  return fromDbRow(data)
}

/** 更新使用者部分欄位 */
export async function 更新使用者欄位(
  id: string,
  fields: Partial<User>
): Promise<void> {
  // 只轉換有傳入的欄位
  const dbFields: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (fields.name !== undefined) dbFields.name = fields.name
  if (fields.avatar !== undefined) dbFields.avatar = fields.avatar
  if (fields.countyId !== undefined) dbFields.county_id = fields.countyId
  if (fields.email !== undefined) dbFields.email = fields.email
  if (fields.googleSub !== undefined) dbFields.google_sub = fields.googleSub
  if (fields.lineUserId !== undefined) dbFields.line_user_id = fields.lineUserId
  if (fields.stravaProfile !== undefined) dbFields.strava_profile = fields.stravaProfile
  if (fields.managedPages !== undefined) dbFields.managed_pages = fields.managedPages
  if (fields.stampImage !== undefined) dbFields.stamp_image = fields.stampImage
  if (fields.stampImages !== undefined) dbFields.stamp_images = JSON.stringify(fields.stampImages)
  if (fields.socialAvatar !== undefined) dbFields.social_avatar = fields.socialAvatar
  if (fields.stats !== undefined) dbFields.stats = fields.stats
  if (fields.verifiedAt !== undefined) dbFields.verified_at = fields.verifiedAt
  if (fields.lineVerifiedUserId !== undefined) dbFields.line_verified_user_id = fields.lineVerifiedUserId
  if (fields.mergedInto !== undefined) dbFields.merged_into = fields.mergedInto
  if (fields.role !== undefined) dbFields.role = fields.role
  if (fields.authUserId !== undefined) dbFields.auth_user_id = fields.authUserId

  const { error } = await supabase
    .from('users')
    .update(dbFields)
    .eq('id', id)

  if (error) {
    console.warn('[Supabase] 更新使用者欄位失敗:', error.message)
  }
}

/** 依 email 查找同 email 的其他帳號（排除已合併帳號） */
export async function 依Email查找帳號(email: string, 排除Id?: string): Promise<Partial<User>[]> {
  if (!email) return []
  let query = supabase
    .from('users')
    .select(USER_SELECT)
    .eq('email', email.toLowerCase().trim())
    .is('merged_into', null)

  if (排除Id) {
    query = query.neq('id', 排除Id)
  }

  const { data, error } = await query
  if (error) {
    console.warn('[Supabase] 依Email查找帳號失敗:', error.message)
    return []
  }
  return (data ?? []).map(fromDbRow)
}

/** 合併使用者：將舊帳號的所有資料轉移到主帳號 */
export async function 合併使用者(主帳號Id: string, 舊帳號Id: string): Promise<boolean> {
  const 轉移表 = [
    'cycling_events',
    'ride_templates',
    'spot_templates',
    'route_info_templates',
    'notes_templates',
  ]

  for (const 表名 of 轉移表) {
    const { error } = await supabase
      .from(表名)
      .update({ creator_id: 主帳號Id })
      .eq('creator_id', 舊帳號Id)
    if (error) {
      console.warn(`[合併] 轉移 ${表名} 失敗:`, error.message)
    }
  }

  // user_verifications：保留已認證紀錄，轉移到主帳號
  const { error: 認證錯誤 } = await supabase
    .from('user_verifications')
    .update({ user_id: 主帳號Id })
    .eq('user_id', 舊帳號Id)
    .eq('status', 'verified')
  if (認證錯誤) {
    console.warn('[合併] 轉移認證紀錄失敗:', 認證錯誤.message)
  }

  // 讀取舊帳號資料，合併頭像/圖章/粉絲頁/認證到主帳號
  const 舊帳號 = await 取得使用者(舊帳號Id)
  if (舊帳號) {
    const 主帳號 = await 取得使用者(主帳號Id)
    const 更新欄位: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (!主帳號?.stampImage && 舊帳號.stampImage) {
      更新欄位.stamp_image = 舊帳號.stampImage
    }
    if (!主帳號?.avatar && 舊帳號.avatar) {
      更新欄位.avatar = 舊帳號.avatar
    }

    // 合併粉絲頁列表
    const 既有頁面 = 主帳號?.managedPages ?? []
    const 舊頁面 = 舊帳號.managedPages ?? []
    if (舊頁面.length > 0) {
      const 已有Id = new Set(既有頁面.map(p => p.pageId))
      const 新增頁面 = 舊頁面.filter(p => !已有Id.has(p.pageId))
      if (新增頁面.length > 0) {
        更新欄位.managed_pages = [...既有頁面, ...新增頁面]
      }
    }

    // 保留已認證狀態
    if (!主帳號?.verifiedAt && 舊帳號.verifiedAt) {
      更新欄位.verified_at = 舊帳號.verifiedAt
      更新欄位.line_verified_user_id = 舊帳號.lineVerifiedUserId
    }

    if (Object.keys(更新欄位).length > 1) {
      await supabase.from('users').update(更新欄位).eq('id', 主帳號Id)
    }
  }

  // 標記舊帳號已合併
  const { error: 標記錯誤 } = await supabase
    .from('users')
    .update({ merged_into: 主帳號Id, updated_at: new Date().toISOString() })
    .eq('id', 舊帳號Id)

  if (標記錯誤) {
    console.warn('[合併] 標記舊帳號失敗:', 標記錯誤.message)
    return false
  }

  return true
}
