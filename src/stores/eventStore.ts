import { create } from 'zustand'
import type { CyclingEvent, Region, StickyColor } from '../types'
import { supabase } from '../utils/supabase'

type 排序方式 = '最新' | '最熱門'

// 判斷活動是否已過期（活動日期隔天凌晨後算過期）
function 已過期(活動: CyclingEvent): boolean {
  const 活動日 = new Date(活動.date)
  活動日.setDate(活動日.getDate() + 1) // 隔天
  活動日.setHours(0, 0, 0, 0)
  return new Date() >= 活動日
}

interface EventState {
  活動列表: CyclingEvent[]
  載入中: boolean
  篩選區域: Region | null
  排序: 排序方式
  設定篩選區域: (region: Region | null) => void
  設定排序: (sort: 排序方式) => void
  載入活動: () => Promise<void>
  載入單一活動: (id: string) => Promise<CyclingEvent | null>
  新增活動: (event: CyclingEvent) => Promise<void>
  更新活動: (eventId: string, 更新: Partial<CyclingEvent>) => Promise<void>
  取得篩選後活動: () => CyclingEvent[]
  取得歷史活動: () => CyclingEvent[]
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
    moakEventId: (row.moak_event_id as string) || undefined,
    stickyColor: (row.sticky_color as StickyColor) || 'yellow',
    tags: (row.tags as string[]) || [],
    creatorId: row.creator_id as string,
    createdAt: row.created_at as string,
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
    moak_event_id: e.moakEventId || null,
    sticky_color: e.stickyColor,
    tags: e.tags,
    creator_id: e.creatorId,
    created_at: e.createdAt,
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
  if (更新.moakEventId !== undefined) result.moak_event_id = 更新.moakEventId || null
  if (更新.stickyColor !== undefined) result.sticky_color = 更新.stickyColor
  if (更新.tags !== undefined) result.tags = 更新.tags
  return result
}

export const useEventStore = create<EventState>()((set, get) => ({
  活動列表: [],
  載入中: true,
  篩選區域: null,
  排序: '最新',

  設定篩選區域: (region) => set({ 篩選區域: region }),
  設定排序: (sort) => set({ 排序: sort }),

  載入單一活動: async (id) => {
    // 先從 store 找
    const 已有 = get().活動列表.find(e => e.id === id)
    if (已有) return 已有
    // 從 Supabase 載入
    const { data, error } = await supabase
      .from('cycling_events')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    const 活動 = 轉換為活動(data as Record<string, unknown>)
    // merge 進 store（避免重複）
    set((s) => {
      if (s.活動列表.some(e => e.id === id)) return s
      return { 活動列表: [活動, ...s.活動列表] }
    })
    return 活動
  },

  載入活動: async () => {
    set({ 載入中: true })
    const { data, error } = await supabase
      .from('cycling_events')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) {
      set({ 活動列表: data.map(轉換為活動) })
    }
    set({ 載入中: false })
  },

  新增活動: async (event) => {
    const row = 轉換為資料列(event)
    const { error } = await supabase.from('cycling_events').insert(row)
    if (!error) {
      set((s) => ({ 活動列表: [event, ...s.活動列表] }))
    }
  },

  更新活動: async (eventId, 更新) => {
    const row = 轉換部分更新(更新)
    const { error } = await supabase.from('cycling_events').update(row).eq('id', eventId)
    if (!error) {
      set((s) => ({
        活動列表: s.活動列表.map(e => e.id === eventId ? { ...e, ...更新 } : e),
      }))
    }
  },

  取得篩選後活動: () => {
    const { 活動列表, 篩選區域, 排序 } = get()
    // 排除過期活動（活動日期隔天後不顯示）
    let 結果 = 活動列表.filter(e => !已過期(e))
    if (篩選區域) {
      結果 = 結果.filter(e => e.region === 篩選區域)
    }
    if (排序 === '最新') {
      結果.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return 結果
  },

  取得歷史活動: () => {
    const { 活動列表 } = get()
    return 活動列表
      .filter(e => 已過期(e))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },
}))
