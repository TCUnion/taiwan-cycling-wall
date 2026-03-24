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
  distance: number    // 公里
  elevation: number   // 公尺
  pace: string        // 例如 '25-30 km/h'
  participants: string[]  // 使用者 ID
  maxParticipants: number
  stravaRouteUrl?: string
  moakEventId?: string
  stickyColor: StickyColor
  tags: string[]
  creatorId: string
  createdAt: string
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
