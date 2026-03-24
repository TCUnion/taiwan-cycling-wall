import type { User } from '../types'

export const 模擬使用者: User[] = [
  {
    id: 'user-1',
    name: '阿明',
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
    name: '小美',
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
    name: '大雄',
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
    name: '阿花',
    avatar: '🌸',
    countyId: 'hualien',
    stats: { totalRides: 18, totalDistance: 1200, totalElevation: 15000, countiesVisited: ['hualien', 'taitung', 'yilan'] },
    achievements: [],
    rideHistory: [],
  },
  {
    id: 'user-5',
    name: '建志',
    avatar: '💪',
    countyId: 'new-taipei',
    stats: { totalRides: 35, totalDistance: 2800, totalElevation: 35000, countiesVisited: ['taipei', 'new-taipei', 'keelung', 'taoyuan', 'yilan'] },
    achievements: [
      { id: 'ach-beiyi', name: '北宜征服者', description: '完成北宜公路', icon: '🛣️', unlockedAt: '2025-08-22' },
    ],
    rideHistory: [],
  },
]
