import type { User, SavedRoute, MeetingSpot, FollowRelation } from '../types'

// 個人收藏路線 mock 資料
export const 模擬收藏路線: Record<string, SavedRoute[]> = {
  'user-1': [
    { id: 'route-1', name: '風櫃嘴—萬里', distance: 45, elevation: 680, countyId: 'taipei' },
    { id: 'route-2', name: '北宜公路全段', distance: 58, elevation: 920, countyId: 'new-taipei' },
    { id: 'route-3', name: '陽金公路', distance: 32, elevation: 550, countyId: 'taipei' },
  ],
  'user-2': [
    { id: 'route-4', name: '大甲溪自行車道', distance: 35, elevation: 120, countyId: 'taichung' },
    { id: 'route-5', name: '日月潭環湖', distance: 30, elevation: 350, countyId: 'nantou' },
  ],
  'user-3': [
    { id: 'route-6', name: '西濱快速道路南段', distance: 85, elevation: 50, countyId: 'kaohsiung' },
    { id: 'route-7', name: '南迴公路', distance: 95, elevation: 620, countyId: 'taitung' },
    { id: 'route-8', name: '壽卡鐵馬驛站', distance: 40, elevation: 480, countyId: 'pingtung' },
  ],
  'user-4': [
    { id: 'route-9', name: '花東縱谷自行車道', distance: 55, elevation: 280, countyId: 'hualien' },
  ],
  'user-5': [
    { id: 'route-10', name: '巴拉卡公路', distance: 28, elevation: 650, countyId: 'new-taipei' },
    { id: 'route-11', name: '106 乙線平溪段', distance: 22, elevation: 380, countyId: 'new-taipei' },
  ],
}

// 集合點 mock 資料
export const 模擬集合點: Record<string, MeetingSpot[]> = {
  'user-1': [
    { id: 'spot-1', name: '捷運劍潭站 1 號出口', address: '台北市士林區基河路', countyId: 'taipei', lat: 25.0847, lng: 121.5250 },
    { id: 'spot-2', name: '河濱自行車租借站（大稻埕）', address: '台北市大同區環河北路', countyId: 'taipei', lat: 25.0565, lng: 121.5072 },
  ],
  'user-2': [
    { id: 'spot-3', name: '台中公園北門', address: '台中市北區公園路', countyId: 'taichung', lat: 24.1445, lng: 120.6832 },
  ],
  'user-3': [
    { id: 'spot-4', name: '蓮池潭龍虎塔停車場', address: '高雄市左營區蓮潭路', countyId: 'kaohsiung', lat: 22.6814, lng: 120.2944 },
    { id: 'spot-5', name: '旗津渡輪站', address: '高雄市旗津區海岸路', countyId: 'kaohsiung', lat: 22.6119, lng: 120.2848 },
  ],
  'user-4': [
    { id: 'spot-6', name: '七星潭停車場', address: '花蓮縣新城鄉海岸路', countyId: 'hualien', lat: 24.0282, lng: 121.6315 },
  ],
  'user-5': [
    { id: 'spot-7', name: '碧潭西岸廣場', address: '新北市新店區新店路', countyId: 'new-taipei', lat: 24.9580, lng: 121.5340 },
  ],
}

// 粉絲/追蹤 mock 資料
export const 模擬追蹤: Record<string, FollowRelation[]> = {
  'user-1': [
    { userId: 'user-2', name: '小美', avatar: '🚲' },
    { userId: 'user-3', name: '大雄', avatar: '🏔️' },
    { userId: 'user-5', name: '建志', avatar: '💪' },
  ],
  'user-2': [
    { userId: 'user-1', name: '阿明', avatar: '🚴' },
    { userId: 'user-3', name: '大雄', avatar: '🏔️' },
  ],
  'user-3': [
    { userId: 'user-1', name: '阿明', avatar: '🚴' },
  ],
  'user-4': [
    { userId: 'user-3', name: '大雄', avatar: '🏔️' },
    { userId: 'user-1', name: '阿明', avatar: '🚴' },
  ],
  'user-5': [
    { userId: 'user-1', name: '阿明', avatar: '🚴' },
    { userId: 'user-2', name: '小美', avatar: '🚲' },
  ],
}

export const 模擬粉絲: Record<string, FollowRelation[]> = {
  'user-1': [
    { userId: 'user-2', name: '小美', avatar: '🚲' },
    { userId: 'user-3', name: '大雄', avatar: '🏔️' },
    { userId: 'user-4', name: '阿花', avatar: '🌸' },
    { userId: 'user-5', name: '建志', avatar: '💪' },
  ],
  'user-2': [
    { userId: 'user-1', name: '阿明', avatar: '🚴' },
    { userId: 'user-5', name: '建志', avatar: '💪' },
  ],
  'user-3': [
    { userId: 'user-1', name: '阿明', avatar: '🚴' },
    { userId: 'user-2', name: '小美', avatar: '🚲' },
    { userId: 'user-4', name: '阿花', avatar: '🌸' },
  ],
  'user-4': [],
  'user-5': [
    { userId: 'user-1', name: '阿明', avatar: '🚴' },
  ],
}

export const 模擬使用者: User[] = [
  {
    id: 'user-1',
    name: '阿明（模擬）',
    avatar: '🚴',
    countyId: 'taipei',
    stats: { totalRides: 42, totalDistance: 3200, totalElevation: 45000, countiesVisited: ['taipei', 'new-taipei', 'taoyuan', 'hsinchu-city', 'yilan', 'hualien'] },
    achievements: [
      { id: 'ach-taipei', name: '台北征服者', description: '完成台北市活動', icon: '🏙️', unlockedAt: '2025-03-01' },
      { id: 'ach-1000km', name: '千里馬', description: '累積騎乘1000公里', icon: '🐎', unlockedAt: '2025-06-15' },
    ],
    rideHistory: [
      { eventId: 'evt-1', date: '2026-03-10', countyId: 'taipei', distance: 80, elevation: 500 },
      { eventId: 'evt-3', date: '2026-03-15', countyId: 'new-taipei', distance: 120, elevation: 1200 },
    ],
  },
  {
    id: 'user-2',
    name: '小美（模擬）',
    avatar: '🚲',
    countyId: 'taichung',
    stats: { totalRides: 28, totalDistance: 1800, totalElevation: 22000, countiesVisited: ['taichung', 'changhua', 'nantou', 'miaoli'] },
    achievements: [
      { id: 'ach-taichung', name: '台中達人', description: '完成台中市活動', icon: '🌇', unlockedAt: '2025-09-20' },
    ],
    rideHistory: [
      { eventId: 'evt-5', date: '2026-03-12', countyId: 'taichung', distance: 45, elevation: 800 },
    ],
  },
  {
    id: 'user-3',
    name: '大雄（模擬）',
    avatar: '🏔️',
    countyId: 'kaohsiung',
    stats: { totalRides: 55, totalDistance: 5500, totalElevation: 68000, countiesVisited: ['kaohsiung', 'pingtung', 'tainan', 'chiayi-city', 'chiayi-county', 'taitung', 'hualien'] },
    achievements: [
      { id: 'ach-5000km', name: '五千里路', description: '累積騎乘5000公里', icon: '🏆', unlockedAt: '2026-01-10' },
      { id: 'ach-wuling', name: '武嶺勇者', description: '完成武嶺攻頂', icon: '⛰️', unlockedAt: '2025-11-05' },
    ],
    rideHistory: [
      { eventId: 'evt-7', date: '2026-03-08', countyId: 'kaohsiung', distance: 100, elevation: 600 },
    ],
  },
  {
    id: 'user-4',
    name: '阿花（模擬）',
    avatar: '🌸',
    countyId: 'hualien',
    stats: { totalRides: 18, totalDistance: 1200, totalElevation: 15000, countiesVisited: ['hualien', 'taitung', 'yilan'] },
    achievements: [],
    rideHistory: [],
  },
  {
    id: 'user-5',
    name: '建志（模擬）',
    avatar: '💪',
    countyId: 'new-taipei',
    stats: { totalRides: 35, totalDistance: 2800, totalElevation: 35000, countiesVisited: ['taipei', 'new-taipei', 'keelung', 'taoyuan', 'yilan'] },
    achievements: [
      { id: 'ach-beiyi', name: '北宜征服者', description: '完成北宜公路', icon: '🛣️', unlockedAt: '2025-08-22' },
    ],
    rideHistory: [],
  },
]
