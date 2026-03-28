import { supabase } from './supabase'
import type { UserRole } from '../types'

// DB row → 前端 UserRole
function fromDbRow(row: Record<string, unknown>): UserRole {
  return {
    id: row.id as string,
    name: row.name as string,
    maxActiveEvents: (row.max_active_events as number) ?? 3,
    sortOrder: (row.sort_order as number) ?? 0,
  }
}

/** 從 Supabase 取得所有角色定義 */
export async function 取得所有角色(): Promise<UserRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.warn('[Supabase] 取得角色失敗:', error.message)
    return []
  }
  return (data ?? []).map(fromDbRow)
}

/** 依角色 ID 取得同時活動上限 */
export async function 取得活動上限(roleId: string): Promise<number> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('max_active_events')
    .eq('id', roleId)
    .single()

  if (error || !data) {
    // 預設回傳最低限制
    return 1
  }
  return data.max_active_events as number
}

/** 計算使用者目前進行中（未過期）的活動數量 */
export async function 計算進行中活動數(userId: string, managedPageIds?: string[]): Promise<number> {
  // 活動日期隔天凌晨後才算過期，所以用今天的日期比對
  const 今天 = new Date().toISOString().split('T')[0]

  // 查詢個人活動
  const { count: 個人數, error: 個人錯誤 } = await supabase
    .from('cycling_events')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', userId)
    .gte('date', 今天)

  if (個人錯誤) {
    console.warn('[Supabase] 計算活動數失敗:', 個人錯誤.message)
  }

  let 總數 = 個人數 ?? 0

  // 查詢粉絲頁活動
  if (managedPageIds && managedPageIds.length > 0) {
    const pageCreatorIds = managedPageIds.map(id => `page-${id}`)
    const { count: 頁面數, error: 頁面錯誤 } = await supabase
      .from('cycling_events')
      .select('*', { count: 'exact', head: true })
      .in('creator_id', pageCreatorIds)
      .gte('date', 今天)

    if (頁面錯誤) {
      console.warn('[Supabase] 計算粉絲頁活動數失敗:', 頁面錯誤.message)
    }
    總數 += 頁面數 ?? 0
  }

  return 總數
}

/** 更新角色設定 */
export async function 更新角色設定(
  id: string,
  fields: { name?: string; maxActiveEvents?: number; sortOrder?: number }
): Promise<boolean> {
  const dbFields: Record<string, unknown> = {}
  if (fields.name !== undefined) dbFields.name = fields.name
  if (fields.maxActiveEvents !== undefined) dbFields.max_active_events = fields.maxActiveEvents
  if (fields.sortOrder !== undefined) dbFields.sort_order = fields.sortOrder

  const { error } = await supabase
    .from('user_roles')
    .update(dbFields)
    .eq('id', id)

  if (error) {
    console.warn('[Supabase] 更新角色失敗:', error.message)
    return false
  }
  return true
}

/** 新增角色 */
export async function 新增角色(role: { id: string; name: string; maxActiveEvents: number; sortOrder: number }): Promise<boolean> {
  const { error } = await supabase
    .from('user_roles')
    .insert({
      id: role.id,
      name: role.name,
      max_active_events: role.maxActiveEvents,
      sort_order: role.sortOrder,
    })

  if (error) {
    console.warn('[Supabase] 新增角色失敗:', error.message)
    return false
  }
  return true
}

/** 刪除角色（內建角色不可刪） */
export async function 刪除角色(id: string): Promise<boolean> {
  const 內建角色 = ['unverified', 'verified', 'admin']
  if (內建角色.includes(id)) return false

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('id', id)

  if (error) {
    console.warn('[Supabase] 刪除角色失敗:', error.message)
    return false
  }
  return true
}

/** 更新使用者角色 */
export async function 更新使用者角色(userId: string, role: string): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.warn('[Supabase] 更新使用者角色失敗:', error.message)
    return false
  }
  return true
}

/** 從 Supabase 取得所有使用者（管理員用） */
export async function 取得所有使用者(): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .is('merged_into', null)
    .order('name', { ascending: true })

  if (error) {
    console.warn('[Supabase] 取得所有使用者失敗:', error.message)
    return []
  }
  return data ?? []
}
