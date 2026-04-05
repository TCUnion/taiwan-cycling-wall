import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEventStore, 取得便利貼顏色, 取得旋轉角度 } from './eventStore'
import type { CyclingEvent } from '../types'

vi.mock('../utils/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}))

vi.mock('../utils/storageService', () => ({
  上傳圖章到Storage: vi.fn(),
}))

function 建立活動(覆蓋: Partial<CyclingEvent> = {}): CyclingEvent {
  return {
    id: 'test-id',
    title: '測試約騎活動',
    description: '',
    countyId: 'TPE',
    region: '北部',
    date: '2025-01-01',
    time: '08:00',
    meetingPoint: '台北車站',
    distance: 50,
    elevation: 500,
    pace: '自由配速',
    maxParticipants: 20,
    stickyColor: 'yellow',
    tags: [],
    creatorId: 'test-creator',
    createdAt: '2025-01-01T00:00:00Z',
    ...覆蓋,
  }
}

// ── 便利貼顏色 ─────────────────────────────────────────────────────────────

describe('取得便利貼顏色', () => {
  it('同一個 id 每次回傳相同顏色（確定性）', () => {
    const id = 'evt-abc123'
    expect(取得便利貼顏色(id)).toBe(取得便利貼顏色(id))
  })

  it('回傳值必須是四種有效顏色之一', () => {
    const 有效顏色 = ['yellow', 'pink', 'blue', 'green']
    for (const id of ['test-1', 'evt-12345', 'fb-987', '']) {
      expect(有效顏色).toContain(取得便利貼顏色(id))
    }
  })

  it('不同 id 可能有不同顏色（分佈不全集中在同一個）', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `id-${i}`)
    const 顏色集合 = new Set(ids.map(取得便利貼顏色))
    expect(顏色集合.size).toBeGreaterThan(1)
  })
})

// ── 旋轉角度 ─────────────────────────────────────────────────────────────

describe('取得旋轉角度', () => {
  it('同一個 id 每次回傳相同旋轉角度（確定性）', () => {
    const id = 'evt-abc123'
    expect(取得旋轉角度(id)).toBe(取得旋轉角度(id))
  })

  it('回傳值符合 sticky-rotate-{n2|n1|0|1|2} 格式', () => {
    const 有效格式 = /^sticky-rotate-(n2|n1|0|1|2)$/
    for (const id of ['test-1', 'evt-12345', 'fb-987', 'long-id-with-many-chars-0123456789']) {
      expect(取得旋轉角度(id)).toMatch(有效格式)
    }
  })
})

// ── 活動過期邏輯 ──────────────────────────────────────────────────────────
// 過期判斷：約騎日期 + 時間 + 12 小時，非隔天凌晨

describe('活動過期邏輯（已過期 / 取得篩選後活動 / 取得歷史活動）', () => {
  beforeEach(() => {
    useEventStore.setState({ 活動列表: [], 載入中: false, 已載入: true })
  })

  it('昨天的活動應視為已過期，出現在歷史、不出現在公告欄', () => {
    const 昨天 = new Date()
    昨天.setDate(昨天.getDate() - 1)
    const 日期 = 昨天.toISOString().split('T')[0]

    useEventStore.setState({ 活動列表: [建立活動({ id: 'past-1', date: 日期, time: '08:00' })] })

    const { 取得篩選後活動, 取得歷史活動 } = useEventStore.getState()
    expect(取得篩選後活動()).toHaveLength(0)
    expect(取得歷史活動()).toHaveLength(1)
  })

  it('明天的活動不應視為過期，出現在公告欄、不出現在歷史', () => {
    const 明天 = new Date()
    明天.setDate(明天.getDate() + 1)
    const 日期 = 明天.toISOString().split('T')[0]

    useEventStore.setState({ 活動列表: [建立活動({ id: 'future-1', date: 日期, time: '08:00' })] })

    const { 取得篩選後活動, 取得歷史活動 } = useEventStore.getState()
    expect(取得篩選後活動()).toHaveLength(1)
    expect(取得歷史活動()).toHaveLength(0)
  })

  it('time 欄位為 null 時預設使用 00:00（兩天前活動必定過期）', () => {
    const 兩天前 = new Date()
    兩天前.setDate(兩天前.getDate() - 2)
    const 日期 = 兩天前.toISOString().split('T')[0]

    // Supabase null 欄位在 JS 執行期為 null，?? '00:00' 會作用
    useEventStore.setState({ 活動列表: [建立活動({ id: 'no-time-1', date: 日期, time: null as unknown as string })] })

    const { 取得歷史活動 } = useEventStore.getState()
    expect(取得歷史活動()).toHaveLength(1)
  })

  it('混合新舊活動時各自歸類正確', () => {
    const 昨天 = new Date()
    昨天.setDate(昨天.getDate() - 1)
    const 明天 = new Date()
    明天.setDate(明天.getDate() + 1)

    useEventStore.setState({
      活動列表: [
        建立活動({ id: 'past', date: 昨天.toISOString().split('T')[0], time: '08:00' }),
        建立活動({ id: 'future', date: 明天.toISOString().split('T')[0], time: '08:00' }),
      ],
    })

    const { 取得篩選後活動, 取得歷史活動 } = useEventStore.getState()
    expect(取得篩選後活動()).toHaveLength(1)
    expect(取得篩選後活動()[0].id).toBe('future')
    expect(取得歷史活動()).toHaveLength(1)
    expect(取得歷史活動()[0].id).toBe('past')
  })
})
