// 登入提供者
export type AuthProvider = 'facebook' | 'google' | 'line' | 'strava'

// 區域類型
export type Region = '北部' | '中部' | '南部' | '東部'

// 便利貼顏色
export type StickyColor = 'yellow' | 'pink' | 'blue' | 'green'

// 縣市資料
export interface County {
  id: string
  name: string
  region: Region
  lat: number
  lng: number
}

// 騎乘活動
export interface CyclingEvent {
  id: string
  title: string
  description: string
  countyId: string
  region: Region
  date: string        // ISO 日期字串
  time: string        // HH:mm
  meetingPoint: string
  meetingPointUrl?: string  // Google Maps 連結
  coverImage?: string       // 封面圖片（base64 或 URL）
  distance: number    // 公里
  elevation: number   // 公尺
  pace: string        // 例如 '25-30 km/h'
  maxParticipants: number
  stravaRouteUrl?: string
  routeCoordinates?: [number, number][]  // 路線庫套用時的座標（GPX/規劃路線）
  moakEventId?: string
  stickyColor: StickyColor
  tags: string[]
  creatorId: string
  createdAt: string
  seriesId?: string | null        // 定期約騎系列 ID（同系列共用）
  recurrenceType?: 'weekly' | 'monthly' | null  // 定期頻率
}

// 使用者
export interface User {
  id: string
  name: string
  avatar: string      // 表情符號或網址
  countyId: string
  stats: UserStats
  achievements: Achievement[]
  rideHistory: RideRecord[]
  managedPages?: PageIdentity[]  // 管理的粉絲頁列表
  activePageId?: string          // 目前使用的粉絲頁 ID（空 = 個人身份）
  stampImage?: string            // [已棄用] 單一圖章，保留向後相容
  stampImages?: string[]         // 活動圖章（最多 3 個 base64 data URL）
  socialAvatar?: string          // 社群登入預設頭像 URL（FB/Google/LINE/Strava）
  authProvider?: AuthProvider    // 登入來源
  email?: string                 // Google 登入時取得
  stravaProfile?: StravaProfile  // Strava 登入時取得
  verifiedAt?: string            // TCU 認證時間（ISO 字串）
  lineVerifiedUserId?: string    // 認證時使用的 LINE User ID
  mergedInto?: string            // 被合併到的主帳號 ID（標記已合併）
  role?: string                  // 使用者角色（預設 'unverified'）
}

// 使用者角色定義（對應 Supabase user_roles 表）
export interface UserRole {
  id: string
  name: string
  maxActiveEvents: number
  sortOrder: number
}

// TCU 認證記錄
export interface UserVerification {
  id: string
  userId: string
  lineUserId?: string
  token: string
  status: 'pending' | 'verified' | 'expired'
  createdAt: string
  verifiedAt?: string
  expiresAt: string
}

// Strava 運動員資料
export interface StravaProfile {
  athleteId: number
  username?: string
  city?: string
  country?: string
  premium: boolean
  accessToken?: string  // 存於前端供後續 API 呼叫
}

export interface UserStats {
  totalRides: number
  totalDistance: number    // 公里
  totalElevation: number  // 公尺
  countiesVisited: string[]  // 縣市 ID
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
}

export interface RideRecord {
  eventId: string
  date: string
  countyId: string
  distance: number
  elevation: number
}

// 約騎範本
export interface RideTemplate {
  id: string
  name: string           // 範本名稱（如「鳥嘴潭晨騎」）
  routeName: string      // 路線名稱
  routeDetail: string    // 路線描述
  routeUrl: string       // 路線連結
  spotName: string       // 集合地點名稱
  spotUrl: string        // Google Maps 連結
  countyId: string
  time: string           // 預設集合時間
  distance: number
  elevation: number
  pace: string
  maxParticipants: number
  notes: string[]        // 注意事項
  creatorId: string
  creatorName?: string   // 建立者名稱（方便顯示）
}

// 路線來源
export type RouteSource = 'manual' | 'gpx' | 'planned'

// 個人儲存路線
export interface SavedRoute {
  id: string
  name: string
  distance: number              // 公里
  elevation: number             // 公尺
  countyId: string
  coordinates: [number, number][] // [lat, lng][]
  waypoints: [number, number][]   // [lat, lng][]（規劃路線的航點）
  source: RouteSource
  gpxFileName?: string
  creatorId: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// GPX 解析結果
export interface GpxParseResult {
  name: string
  coordinates: [number, number][]
  distance: number    // 公里
  elevation: number   // 公尺
  pointCount: number
}

// 集合點
export interface MeetingSpot {
  id: string
  name: string
  address: string
  countyId: string
  lat: number
  lng: number
}

// 粉絲頁身份（Facebook Page）
export interface PageIdentity {
  pageId: string
  name: string
  pictureUrl: string
}

// 粉絲/追蹤關係
export interface FollowRelation {
  userId: string
  name: string
  avatar: string
}

// 廣告版位（來自 Supabase tcuad_internal_placements / tcuad_placements）
export interface AdPlacement {
  id: string
  brand_name: string
  product_name: string
  product_url: string
  placement_text: string
  image_url: string
  priority: number
  is_active: boolean
}

// 集合點範本
export interface SpotTemplate {
  id: string
  name: string        // 地點名稱
  url: string         // Google Maps 連結
  countyId: string    // 縣市
  creatorId: string   // 建立者
}

// 路線與騎乘資訊範本
export interface RouteInfoTemplate {
  id: string
  name: string           // 範本名稱
  routeName: string      // 路線名稱
  routeDetail: string    // 路線描述
  routeUrl: string       // 路線連結
  distance: number       // 公里
  elevation: number      // 公尺
  pace: string           // 配速/難度
  maxParticipants: number
  creatorId: string
}

// 注意事項範本
export interface NotesTemplate {
  id: string
  name: string        // 範本名稱
  notes: string       // 注意事項內容（多行文字）
  creatorId: string
}

// 經典路線模板
export interface RouteTemplate {
  id: string
  name: string
  defaultCountyId: string
  distance: number
  elevation: number
  difficulty: '休閒' | '中等' | '挑戰' | '極限'
  description: string
}
