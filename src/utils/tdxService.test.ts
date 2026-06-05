import { describe, it, expect } from 'vitest'
import { 解析WKT, 縣市轉Slug } from './tdxService'

describe('解析WKT', () => {
  it('解析 LINESTRING 並交換為 [lat, lng]', () => {
    // WKT 為「經度 緯度」
    const r = 解析WKT('LINESTRING (121.5 24.1, 121.6 24.2)')
    expect(r).toEqual([[[24.1, 121.5], [24.2, 121.6]]])
  })

  it('解析 MULTILINESTRING 為多段', () => {
    const r = 解析WKT('MULTILINESTRING ((121.0 24.0, 121.1 24.1), (122.0 23.0, 122.1 23.1))')
    expect(r).toHaveLength(2)
    expect(r[0]).toEqual([[24.0, 121.0], [24.1, 121.1]])
    expect(r[1]).toEqual([[23.0, 122.0], [23.1, 122.1]])
  })

  it('過濾不足兩點的段落', () => {
    expect(解析WKT('LINESTRING (121.5 24.1)')).toEqual([])
  })

  it('過濾超出經緯度範圍的座標', () => {
    expect(解析WKT('LINESTRING (200 24.1, 121.6 99)')).toEqual([])
  })

  it('空字串回傳空陣列', () => {
    expect(解析WKT('')).toEqual([])
  })
})

describe('縣市轉Slug', () => {
  it('對照已知縣市', () => {
    expect(縣市轉Slug('taichung')).toBe('Taichung')
    expect(縣市轉Slug('miaoli')).toBe('MiaoliCounty')
    expect(縣市轉Slug('hsinchu-city')).toBe('Hsinchu')
  })

  it('未知縣市回傳 null', () => {
    expect(縣市轉Slug('atlantis')).toBeNull()
  })
})
