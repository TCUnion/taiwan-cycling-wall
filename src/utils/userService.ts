import { supabase } from './supabase'
import type { User } from '../types'

// 前端 User → DB row（camelCase → snake_case）
function toDbRow(user: User) {
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    county_id: user.countyId,
    auth_provider: user.authProvider ?? null,
    email: user.email ?? null,
    strava_profile: user.stravaProfile ?? null,
    managed_pages: user.managedPages ?? [],
    stamp_image: user.stampImage ?? null,
    social_avatar: user.socialAvatar ?? null,
    stats: user.stats,
    updated_at: new Date().toISOString(),
  }
}

// DB row → 前端 User（snake_case → camelCase）
function fromDbRow(row: Record<string, unknown>): Partial<User> {
  return {
    id: row.id as string,
    name: row.name as string,
    avatar: (row.avatar as string) ?? '',
    countyId: (row.county_id as string) ?? '',
    authProvider: row.auth_provider as User['authProvider'],
    email: row.email as string | undefined,
    stravaProfile: row.strava_profile as User['stravaProfile'],
    managedPages: (row.managed_pages as User['managedPages']) ?? [],
    stampImage: row.stamp_image as string | undefined,
    socialAvatar: row.social_avatar as string | undefined,
    stats: row.stats as User['stats'],
  }
}

/** 從 Supabase 取得使用者 */
export async function 取得使用者(id: string): Promise<Partial<User> | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
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
  if (fields.stravaProfile !== undefined) dbFields.strava_profile = fields.stravaProfile
  if (fields.managedPages !== undefined) dbFields.managed_pages = fields.managedPages
  if (fields.stampImage !== undefined) dbFields.stamp_image = fields.stampImage
  if (fields.socialAvatar !== undefined) dbFields.social_avatar = fields.socialAvatar
  if (fields.stats !== undefined) dbFields.stats = fields.stats

  const { error } = await supabase
    .from('users')
    .update(dbFields)
    .eq('id', id)

  if (error) {
    console.warn('[Supabase] 更新使用者欄位失敗:', error.message)
  }
}
