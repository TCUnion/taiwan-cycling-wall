import { describe, it, expect } from 'vitest'
import { 解析地圖座標, 計算座標距離公里, 建立集合點路線起點警告 } from './geoUtils'

describe('解析地圖座標', () => {
  it('解析 @lat,lng 格式', () => {
    expect(解析地圖座標('https://maps.google.com/maps/@25.0478,121.5170,15z')).toEqual({ lat: 25.0478, lon: 121.5170 })
  })

  it('解析 !3d!4d 格式', () => {
    expect(解析地圖座標('https://maps.google.com/maps/place/foo/data=!3d25.04!4d121.51')).toEqual({ lat: 25.04, lon: 121.51 })
  })

  it('解析 ?q=loc:lat,lng 格式', () => {
    expect(解析地圖座標('https://maps.google.com/?q=loc:25.04,121.51')).toEqual({ lat: 25.04, lon: 121.51 })
  })

  it('解析 ?q=lat,lng 格式', () => {
    expect(解析地圖座標('https://maps.google.com/?q=25.04,121.51')).toEqual({ lat: 25.04, lon: 121.51 })
  })

  it('解析 ?ll=lat,lng 格式', () => {
    expect(解析地圖座標('https://maps.google.com/?ll=25.04,121.51')).toEqual({ lat: 25.04, lon: 121.51 })
  })

  it('解析 percent-encoded URL', () => {
    expect(解析地圖座標('https://maps.google.com/maps/%4025.0478%2C121.5170%2C15z')).toEqual({ lat: 25.0478, lon: 121.5170 })
  })

  it('shortened URL 回傳 null', () => {
    expect(解析地圖座標('https://maps.app.goo.gl/abc123')).toBeNull()
  })

  it('空字串或 null/undefined 回傳 null', () => {
    expect(解析地圖座標('')).toBeNull()
    expect(解析地圖座標(undefined)).toBeNull()
    expect(解析地圖座標(null)).toBeNull()
  })

  it('緯度 > 90 回傳 null', () => {
    expect(解析地圖座標('https://maps.google.com/?q=91,121.51')).toBeNull()
  })

  it('經度 > 180 回傳 null', () => {
    expect(解析地圖座標('https://maps.google.com/?q=25,181')).toBeNull()
  })
})

describe('計算座標距離公里', () => {
  it('同一點距離為 0', () => {
    expect(計算座標距離公里({ lat: 25, lon: 121 }, { lat: 25, lon: 121 })).toBe(0)
  })

  it('台北車站到板橋車站約 6 公里', () => {
    const 台北車站 = { lat: 25.0478, lon: 121.5170 }
    const 板橋車站 = { lat: 25.0136, lon: 121.4636 }
    const d = 計算座標距離公里(台北車站, 板橋車站)
    expect(d).toBeGreaterThan(5)
    expect(d).toBeLessThan(8)
  })

  it('距離恆為非負', () => {
    expect(計算座標距離公里({ lat: -45, lon: -120 }, { lat: 60, lon: 30 })).toBeGreaterThan(0)
  })
})

describe('建立集合點路線起點警告', () => {
  it('無集合點 URL 回傳 null', () => {
    expect(建立集合點路線起點警告({ 路線座標: [[25.04, 121.51]] })).toBeNull()
  })

  it('無路線座標回傳 null', () => {
    expect(建立集合點路線起點警告({ 集合點URL: 'https://maps.google.com/?q=25.04,121.51' })).toBeNull()
  })

  it('shortened URL 回傳 null（不誤報）', () => {
    expect(建立集合點路線起點警告({
      集合點URL: 'https://maps.app.goo.gl/abc',
      路線座標: [[24.0, 120.0]],
    })).toBeNull()
  })

  it('距離 ≤ 閾值不警告', () => {
    expect(建立集合點路線起點警告({
      集合點URL: 'https://maps.google.com/?q=25.0478,121.5170',
      路線座標: [[25.0480, 121.5172]],
      閾值公里: 1,
    })).toBeNull()
  })

  it('距離 > 閾值回傳警告物件含距離與兩點', () => {
    const w = 建立集合點路線起點警告({
      集合點URL: 'https://maps.google.com/?q=25.0478,121.5170',
      路線座標: [[25.0136, 121.4636]],
      閾值公里: 1,
    })
    expect(w).not.toBeNull()
    expect(w!.距離公里).toBeGreaterThan(1)
    expect(w!.集合點座標).toEqual({ lat: 25.0478, lon: 121.5170 })
    expect(w!.路線起點座標).toEqual({ lat: 25.0136, lon: 121.4636 })
  })

  it('路線座標起點無效時回傳 null', () => {
    expect(建立集合點路線起點警告({
      集合點URL: 'https://maps.google.com/?q=25,121',
      路線座標: [[NaN, 121]],
    })).toBeNull()
  })

  it('預設閾值為 1 公里', () => {
    // 兩點相距 ~5.4 km，預設閾值應觸發
    const w = 建立集合點路線起點警告({
      集合點URL: 'https://maps.google.com/?q=25.0478,121.5170',
      路線座標: [[25.0136, 121.4636]],
    })
    expect(w).not.toBeNull()
  })

  it('外部路線起點：無路線庫座標時 fallback 使用', () => {
    const w = 建立集合點路線起點警告({
      集合點URL: 'https://maps.google.com/?q=25.0478,121.5170',
      外部路線起點: { lat: 25.0136, lon: 121.4636 },
      閾值公里: 1,
    })
    expect(w).not.toBeNull()
    expect(w!.路線起點座標).toEqual({ lat: 25.0136, lon: 121.4636 })
  })

  it('外部路線起點：路線庫座標優先', () => {
    const w = 建立集合點路線起點警告({
      集合點URL: 'https://maps.google.com/?q=25.0478,121.5170',
      路線座標: [[24.0, 120.0]],
      外部路線起點: { lat: 25.05, lon: 121.52 },
      閾值公里: 1,
    })
    expect(w).not.toBeNull()
    expect(w!.路線起點座標).toEqual({ lat: 24.0, lon: 120.0 })
  })

  it('外部路線起點為 null 且無路線庫座標時不警告', () => {
    expect(建立集合點路線起點警告({
      集合點URL: 'https://maps.google.com/?q=25.04,121.51',
      外部路線起點: null,
    })).toBeNull()
  })
})
