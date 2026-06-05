/**
 * TDX 觀光 API 服務層 — 透過 /api/tdx Cloudflare Function 代理取得資料
 *
 * 提供兩類（TDX 僅此兩類有對應 API）：
 * - 自行車道線型 (Cycling/Shape)：每縣市的自行車道，含 WKT 幾何
 * - 觀光景點 (Tourism/ScenicSpot)：景點點位、圖片、開放時間
 *
 * 旅遊服務站點 / 周邊設施僅存在於「觀光資料標準」文件，TDX API 尚未發布，故不含。
 */

// 約騎系統縣市 id → TDX 英文 slug
const 縣市Slug對照: Record<string, string> = {
  'taipei': 'Taipei',
  'new-taipei': 'NewTaipei',
  'keelung': 'Keelung',
  'taoyuan': 'Taoyuan',
  'hsinchu-city': 'Hsinchu',
  'hsinchu-county': 'HsinchuCounty',
  'yilan': 'YilanCounty',
  'miaoli': 'MiaoliCounty',
  'taichung': 'Taichung',
  'changhua': 'ChanghuaCounty',
  'nantou': 'NantouCounty',
  'yunlin': 'YunlinCounty',
  'chiayi-city': 'Chiayi',
  'chiayi-county': 'ChiayiCounty',
  'tainan': 'Tainan',
  'kaohsiung': 'Kaohsiung',
  'pingtung': 'PingtungCounty',
  'penghu': 'PenghuCounty',
  'hualien': 'HualienCounty',
  'taitung': 'TaitungCounty',
  'kinmen': 'KinmenCounty',
  'lienchiang': 'LienchiangCounty',
}

export function 縣市轉Slug(countyId: string): string | null {
  return 縣市Slug對照[countyId] ?? null
}

// ---- 自行車道 ----

export interface 自行車道 {
  名稱: string
  縣市: string
  鄉鎮: string
  起點: string
  終點: string
  長度公里: number
  // 折線段落（每段為 [lat, lng][]，支援多段線）
  線段: [number, number][][]
}

interface TDX自行車道原始 {
  RouteName?: string
  City?: string
  Town?: string
  RoadSectionStart?: string
  RoadSectionEnd?: string
  CyclingLength?: number
  Geometry?: string
}

/**
 * 解析 WKT LINESTRING / MULTILINESTRING → [lat, lng][][]
 * WKT 座標順序為「經度 緯度」，Leaflet 需要「緯度, 經度」故交換。
 */
export function 解析WKT(wkt: string): [number, number][][] {
  if (!wkt) return []
  const 段落們: [number, number][][] = []
  // 抓出每一組最內層括號內的座標序列
  const groups = wkt.match(/\(([^()]+)\)/g)
  if (!groups) return []
  for (const g of groups) {
    const inner = g.slice(1, -1).trim()
    if (!inner) continue
    const points: [number, number][] = []
    for (const pair of inner.split(',')) {
      const nums = pair.trim().split(/\s+/).map(Number)
      if (nums.length >= 2 && Number.isFinite(nums[0]) && Number.isFinite(nums[1])) {
        const [lng, lat] = nums
        if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) points.push([lat, lng])
      }
    }
    if (points.length >= 2) 段落們.push(points)
  }
  return 段落們
}

export async function 取得自行車道(countyId: string): Promise<自行車道[]> {
  const slug = 縣市轉Slug(countyId)
  if (!slug) return []
  const res = await fetch(`/api/tdx?resource=cycling&city=${slug}`)
  if (!res.ok) throw new Error(`自行車道載入失敗（${res.status}）`)
  const data = (await res.json()) as TDX自行車道原始[]
  return data
    .map((r) => ({
      名稱: r.RouteName ?? '未命名自行車道',
      縣市: r.City ?? '',
      鄉鎮: r.Town ?? '',
      起點: r.RoadSectionStart ?? '',
      終點: r.RoadSectionEnd ?? '',
      長度公里: r.CyclingLength ? Math.round((r.CyclingLength / 1000) * 10) / 10 : 0,
      線段: 解析WKT(r.Geometry ?? ''),
    }))
    .filter((r) => r.線段.length > 0)
}

// ---- 觀光景點 ----

export interface 觀光景點 {
  id: string
  名稱: string
  描述: string
  地址: string
  電話: string
  開放時間: string
  圖片網址: string
  網站: string
  緯度: number
  經度: number
}

interface TDX景點原始 {
  ScenicSpotID?: string
  ScenicSpotName?: string
  Description?: string
  DescriptionDetail?: string
  Address?: string
  Phone?: string
  OpenTime?: string
  WebsiteUrl?: string
  Picture?: { PictureUrl1?: string }
  Position?: { PositionLat?: number; PositionLon?: number }
}

export async function 取得觀光景點(countyId: string): Promise<觀光景點[]> {
  const slug = 縣市轉Slug(countyId)
  if (!slug) return []
  const res = await fetch(`/api/tdx?resource=scenicspot&city=${slug}`)
  if (!res.ok) throw new Error(`觀光景點載入失敗（${res.status}）`)
  const data = (await res.json()) as TDX景點原始[]
  return data
    .map((r) => ({
      id: r.ScenicSpotID ?? '',
      名稱: r.ScenicSpotName ?? '未命名景點',
      描述: r.Description || r.DescriptionDetail || '',
      地址: r.Address ?? '',
      電話: r.Phone ?? '',
      開放時間: r.OpenTime ?? '',
      圖片網址: r.Picture?.PictureUrl1 ?? '',
      網站: r.WebsiteUrl ?? '',
      緯度: r.Position?.PositionLat ?? 0,
      經度: r.Position?.PositionLon ?? 0,
    }))
    .filter((s) => s.緯度 !== 0 && s.經度 !== 0)
}
