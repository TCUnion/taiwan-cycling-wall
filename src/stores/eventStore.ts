import { create } from 'zustand'
import type { CyclingEvent, Region, StickyColor } from '../types'
import { 取得目前AuthUserId, supabase } from '../utils/supabase'
import { 上傳圖章到Storage } from '../utils/storageService'

type 排序方式 = '最新' | '最熱門'

// 判斷活動是否已過期（約騎時間後 12 小時算過期）
export function 活動已過期(活動: Pick<CyclingEvent, 'date' | 'time'>): boolean {
  const [時, 分] = (活動.time ?? '00:00').split(':').map(Number)
  const 約騎時間 = new Date(活動.date)
  約騎時間.setHours(時, 分, 0, 0)
  約騎時間.setTime(約騎時間.getTime() + 12 * 60 * 60 * 1000)
  return new Date() >= 約騎時間
}

export interface 我的活動識別 {
  creatorId?: string
  authUserId?: string
  粉絲頁Ids?: string[]
}

/**
 * 查詢用的日期界線（YYYY-MM-DD）。
 * 過期判定是「約騎日 + 時間 + 12 小時」，最晚可以拖到隔天中午，
 * 所以未過期活動的伺服器端界線要往前抓一天，再交給 活動已過期() 做精確判斷。
 */
function 未過期查詢界線(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

interface EventState {
  /** 未過期活動（公布欄用）。過期的不在這裡，見 歷史活動列表 */
  活動列表: CyclingEvent[]
  歷史活動列表: CyclingEvent[]
  歷史總數: number
  我的活動列表: CyclingEvent[]
  載入中: boolean
  已載入: boolean
  歷史載入中: boolean
  歷史已載入: boolean
  我的活動載入中: boolean
  篩選區域: Region | null
  排序: 排序方式
  設定篩選區域: (region: Region | null) => void
  設定排序: (sort: 排序方式) => void
  載入活動: () => Promise<void>
  載入歷史活動: (上限?: number) => Promise<void>
  載入歷史總數: () => Promise<void>
  載入我的活動: (識別: 我的活動識別) => Promise<void>
  載入單一活動: (id: string) => Promise<CyclingEvent | null>
  新增活動: (event: CyclingEvent) => Promise<void>
  批次新增活動: (events: CyclingEvent[]) => Promise<{ 成功數: number; 失敗數: number }>
  更新活動: (eventId: string, 更新: Partial<CyclingEvent>) => Promise<void>
  刪除活動: (eventId: string) => Promise<void>
  取得篩選後活動: () => CyclingEvent[]
  取得歷史活動: () => CyclingEvent[]
}

/**
 * 歷史來源有兩份：伺服器端撈回來的 歷史活動列表，
 * 以及 活動列表 裡剛好在瀏覽期間跨過過期線的那幾筆。合併後去重再排序。
 */
export function 合併歷史活動(
  活動列表: CyclingEvent[],
  歷史活動列表: CyclingEvent[],
): CyclingEvent[] {
  const 合併 = new Map<string, CyclingEvent>()
  for (const e of [...歷史活動列表, ...活動列表]) {
    if (活動已過期(e)) 合併.set(e.id, e)
  }
  return [...合併.values()]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// 活動可能只存在於其中一份清單（公布欄／歷史／個人中心），三份都要找
function 於各清單尋找(
  s: Pick<EventState, '活動列表' | '歷史活動列表' | '我的活動列表'>,
  eventId: string,
): CyclingEvent | undefined {
  return s.活動列表.find(e => e.id === eventId)
    ?? s.我的活動列表.find(e => e.id === eventId)
    ?? s.歷史活動列表.find(e => e.id === eventId)
}

async function 取得必要AuthUserId(): Promise<string> {
  const authUserId = await 取得目前AuthUserId()
  if (!authUserId) {
    throw new Error('登入狀態已失效，請重新登入後再試')
  }
  return authUserId
}

// 根據ID產生固定的便利貼顏色
const 便利貼顏色列表: StickyColor[] = ['yellow', 'pink', 'blue', 'green']
export const 取得便利貼顏色 = (id: string): StickyColor => {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return 便利貼顏色列表[Math.abs(hash) % 4]
}

// 根據ID產生固定的旋轉角度 class
export const 取得旋轉角度 = (id: string): string => {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  const 角度 = (Math.abs(hash) % 5) - 2
  return `sticky-rotate-${角度 < 0 ? 'n' + Math.abs(角度) : 角度}`
}

// 活動查詢欄位（列表用：不含 route_coordinates，節省 payload）
const 活動列表欄位 = 'id,title,description,county_id,region,date,time,meeting_point,meeting_point_url,cover_image,distance,elevation,pace,max_participants,strava_route_url,moak_event_id,sticky_color,tags,creator_id,creator_auth_user_id,created_at,series_id,recurrence_type'
// 活動查詢欄位（詳情用：含 route_coordinates，供地圖顯示）
const 活動詳情欄位 = `${活動列表欄位},route_coordinates`

// Supabase snake_case → 前端 camelCase
function 轉換為活動(row: Record<string, unknown>): CyclingEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || '',
    countyId: row.county_id as string,
    region: row.region as Region,
    date: row.date as string,
    time: row.time as string,
    meetingPoint: (row.meeting_point as string) || '',
    meetingPointUrl: (row.meeting_point_url as string) || undefined,
    coverImage: (row.cover_image as string) || undefined,
    distance: Number(row.distance) || 0,
    elevation: Number(row.elevation) || 0,
    pace: (row.pace as string) || '自由配速',
    maxParticipants: (row.max_participants as number) || 20,
    stravaRouteUrl: (row.strava_route_url as string) || undefined,
    routeCoordinates: (row.route_coordinates as [number, number][]) || undefined,
    moakEventId: (row.moak_event_id as string) || undefined,
    stickyColor: (row.sticky_color as StickyColor) || 'yellow',
    tags: (row.tags as string[]) || [],
    creatorId: row.creator_id as string,
    creatorAuthUserId: (row.creator_auth_user_id as string) || undefined,
    createdAt: row.created_at as string,
    seriesId: (row.series_id as string) || null,
    recurrenceType: (row.recurrence_type as 'weekly' | 'monthly') || null,
  }
}

// 前端 camelCase → Supabase snake_case
function 轉換為資料列(e: CyclingEvent) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    county_id: e.countyId,
    region: e.region,
    date: e.date,
    time: e.time,
    meeting_point: e.meetingPoint,
    meeting_point_url: e.meetingPointUrl || null,
    cover_image: e.coverImage || null,
    distance: e.distance,
    elevation: e.elevation,
    pace: e.pace,
    max_participants: e.maxParticipants,
    strava_route_url: e.stravaRouteUrl || null,
    route_coordinates: e.routeCoordinates || null,
    moak_event_id: e.moakEventId || null,
    sticky_color: e.stickyColor,
    tags: e.tags,
    creator_id: e.creatorId,
    creator_auth_user_id: e.creatorAuthUserId ?? null,
    created_at: e.createdAt,
    series_id: e.seriesId || null,
    recurrence_type: e.recurrenceType || null,
  }
}

// 部分更新用的轉換
function 轉換部分更新(更新: Partial<CyclingEvent>) {
  const result: Record<string, unknown> = {}
  if (更新.title !== undefined) result.title = 更新.title
  if (更新.description !== undefined) result.description = 更新.description
  if (更新.countyId !== undefined) result.county_id = 更新.countyId
  if (更新.region !== undefined) result.region = 更新.region
  if (更新.date !== undefined) result.date = 更新.date
  if (更新.time !== undefined) result.time = 更新.time
  if (更新.meetingPoint !== undefined) result.meeting_point = 更新.meetingPoint
  if (更新.meetingPointUrl !== undefined) result.meeting_point_url = 更新.meetingPointUrl || null
  if (更新.coverImage !== undefined) result.cover_image = 更新.coverImage || null
  if (更新.distance !== undefined) result.distance = 更新.distance
  if (更新.elevation !== undefined) result.elevation = 更新.elevation
  if (更新.pace !== undefined) result.pace = 更新.pace
  if (更新.maxParticipants !== undefined) result.max_participants = 更新.maxParticipants
  if (更新.stravaRouteUrl !== undefined) result.strava_route_url = 更新.stravaRouteUrl || null
  if (更新.routeCoordinates !== undefined) result.route_coordinates = 更新.routeCoordinates || null
  if (更新.moakEventId !== undefined) result.moak_event_id = 更新.moakEventId || null
  if (更新.stickyColor !== undefined) result.sticky_color = 更新.stickyColor
  if (更新.tags !== undefined) result.tags = 更新.tags
  return result
}

export const useEventStore = create<EventState>()((set, get) => ({
  活動列表: [],
  歷史活動列表: [],
  歷史總數: 0,
  我的活動列表: [],
  載入中: false,
  已載入: false,
  歷史載入中: false,
  歷史已載入: false,
  我的活動載入中: false,
  篩選區域: null,
  排序: '最新',

  設定篩選區域: (region) => set({ 篩選區域: region }),
  設定排序: (sort) => set({ 排序: sort }),

  載入單一活動: async (id) => {
    // 從 Supabase 載入完整資料（含 route_coordinates）
    const { data, error } = await supabase
      .from('cycling_events')
      .select(活動詳情欄位)
      .eq('id', id)
      .single()
    if (error || !data) {
      // fallback：回傳 store 中已有的精簡版
      return get().活動列表.find(e => e.id === id) ?? null
    }
    const 活動 = 轉換為活動(data as Record<string, unknown>)
    // merge 進 store（取代精簡版）
    set((s) => {
      const 其他 = s.活動列表.filter(e => e.id !== id)
      return { 活動列表: [活動, ...其他] }
    })
    return 活動
  },

  // 公布欄只需要未過期活動。過去抓全表（含所有 base64 圖章）讓首屏要下載
  // 1 MB 以上、而且會隨活動數無上限成長，其中絕大多數會被 取得篩選後活動 濾掉。
  載入活動: async () => {
    set({ 載入中: true })
    const { data, error } = await supabase
      .from('cycling_events')
      .select(活動列表欄位)
      .gte('date', 未過期查詢界線())
      .order('created_at', { ascending: false })
    if (!error && data) {
      set({ 活動列表: data.map(轉換為活動) })
    }
    set({ 載入中: false, 已載入: true })
  },

  載入歷史活動: async (上限 = 200) => {
    set({ 歷史載入中: true })
    const { data, error } = await supabase
      .from('cycling_events')
      .select(活動列表欄位)
      .lt('date', 未過期查詢界線())
      .order('date', { ascending: false })
      .limit(上限)
    if (!error && data) {
      set({ 歷史活動列表: data.map(轉換為活動) })
    }
    set({ 歷史載入中: false, 歷史已載入: true })
  },

  // 公布欄右上角的歷史筆數只需要數字，不必把資料抓下來
  載入歷史總數: async () => {
    const { count, error } = await supabase
      .from('cycling_events')
      .select('id', { count: 'exact', head: true })
      .lt('date', 未過期查詢界線())
    if (!error && typeof count === 'number') {
      set({ 歷史總數: count })
    }
  },

  // 個人中心要看自己的活動（含已過期），改用伺服器端條件撈，不再依賴整張表在記憶體裡
  載入我的活動: async (識別) => {
    const 條件: string[] = []
    if (識別.creatorId) 條件.push(`creator_id.eq.${識別.creatorId}`)
    if (識別.authUserId) 條件.push(`creator_auth_user_id.eq.${識別.authUserId}`)
    for (const pageId of 識別.粉絲頁Ids ?? []) {
      條件.push(`creator_id.eq.${pageId}`)
    }
    if (條件.length === 0) {
      set({ 我的活動列表: [] })
      return
    }
    set({ 我的活動載入中: true })
    const { data, error } = await supabase
      .from('cycling_events')
      .select(活動列表欄位)
      .or(條件.join(','))
      .order('date', { ascending: false })
    if (!error && data) {
      set({ 我的活動列表: data.map(轉換為活動) })
    }
    set({ 我的活動載入中: false })
  },

  新增活動: async (event) => {
    // 若圖章為 base64，先上傳到 Storage 取得公開 URL（供 OG 圖片使用）
    let supabaseCoverImage = event.coverImage
    if (event.coverImage?.startsWith('data:')) {
      const publicUrl = await 上傳圖章到Storage(event.coverImage, event.id)
      if (!publicUrl.startsWith('data:')) supabaseCoverImage = publicUrl
    }
    const authUserId = await 取得必要AuthUserId()
    const localEvent = { ...event, creatorAuthUserId: authUserId }
    const row = {
      ...轉換為資料列({ ...event, coverImage: supabaseCoverImage, creatorAuthUserId: authUserId }),
      creator_auth_user_id: authUserId,
    }
    const { error } = await supabase.from('cycling_events').insert(row)
    if (error) {
      throw new Error(error.message || '新增活動失敗')
    }
    // 本地 store 保留原始 base64，UI 顯示不需網路
    set((s) => ({
      活動列表: [localEvent, ...s.活動列表],
      我的活動列表: [localEvent, ...s.我的活動列表],
    }))
  },

  批次新增活動: async (events) => {
    if (events.length === 0) return { 成功數: 0, 失敗數: 0 }

    // 第一筆若有 base64 圖章，上傳一次，後續共用同一 URL
    let sharedCoverImage = events[0].coverImage
    if (sharedCoverImage?.startsWith('data:')) {
      const publicUrl = await 上傳圖章到Storage(sharedCoverImage, events[0].id)
      if (!publicUrl.startsWith('data:')) sharedCoverImage = publicUrl
    }

    const authUserId = await 取得必要AuthUserId()
    const rows = events.map(e => ({
      ...轉換為資料列({
        ...e,
        coverImage: sharedCoverImage,
        creatorAuthUserId: authUserId,
      }),
      creator_auth_user_id: authUserId,
    }))

    const { error } = await supabase.from('cycling_events').insert(rows)
    if (error) {
      throw new Error(error.message || '批次新增活動失敗')
    }

    // 本地 store 保留原始 base64
    const localEvents = events.map(e => ({
      ...e,
      creatorAuthUserId: authUserId,
      coverImage: events[0].coverImage, // 保留原始 base64
    }))
    set((s) => ({
      活動列表: [...localEvents, ...s.活動列表],
      我的活動列表: [...localEvents, ...s.我的活動列表],
    }))
    return { 成功數: events.length, 失敗數: 0 }
  },

  更新活動: async (eventId, 更新) => {
    const 既有活動 = 於各清單尋找(get(), eventId)
    if (!既有活動) {
      throw new Error('找不到活動資料，請重新整理後再試')
    }
    if (活動已過期(既有活動)) {
      throw new Error('已過期的約騎不可修改')
    }
    // 若圖章為 base64，先上傳到 Storage 取得公開 URL（供 OG 圖片使用）
    let supabase更新 = 更新
    if (更新.coverImage?.startsWith('data:')) {
      const publicUrl = await 上傳圖章到Storage(更新.coverImage, eventId)
      if (!publicUrl.startsWith('data:')) supabase更新 = { ...更新, coverImage: publicUrl }
    }
    await 取得必要AuthUserId()
    const row = 轉換部分更新(supabase更新)
    const { error } = await supabase.from('cycling_events').update(row).eq('id', eventId)
    if (error) {
      throw new Error(error.message || '更新活動失敗')
    }
    // 本地 store 保留原始 base64，UI 顯示不需網路
    const 套用更新 = (清單: CyclingEvent[]) =>
      清單.map(e => e.id === eventId ? { ...e, ...更新 } : e)
    set((s) => ({
      活動列表: 套用更新(s.活動列表),
      歷史活動列表: 套用更新(s.歷史活動列表),
      我的活動列表: 套用更新(s.我的活動列表),
    }))
  },

  刪除活動: async (eventId) => {
    const 既有活動 = 於各清單尋找(get(), eventId)
    if (!既有活動) {
      throw new Error('找不到活動資料，請重新整理後再試')
    }
    if (活動已過期(既有活動)) {
      throw new Error('已過期的約騎不可刪除')
    }
    await 取得必要AuthUserId()
    const { error } = await supabase.from('cycling_events').delete().eq('id', eventId)
    if (error) {
      throw new Error(error.message || '刪除活動失敗')
    }
    const 移除 = (清單: CyclingEvent[]) => 清單.filter(e => e.id !== eventId)
    set((s) => ({
      活動列表: 移除(s.活動列表),
      歷史活動列表: 移除(s.歷史活動列表),
      我的活動列表: 移除(s.我的活動列表),
    }))
  },

  取得篩選後活動: () => {
    const { 活動列表, 篩選區域, 排序 } = get()
    // 排除過期活動（活動日期隔天後不顯示）
    let 結果 = 活動列表.filter(e => !活動已過期(e))
    if (篩選區域) {
      結果 = 結果.filter(e => e.region === 篩選區域)
    }
    if (排序 === '最新') {
      結果.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return 結果
  },

  取得歷史活動: () => {
    const { 活動列表, 歷史活動列表 } = get()
    return 合併歷史活動(活動列表, 歷史活動列表)
  },
}))
