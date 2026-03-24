import type { County, Region } from '../types'

// 區域顏色對照
export const 區域顏色: Record<Region, string> = {
  '北部': 'region-north',
  '中部': 'region-central',
  '南部': 'region-south',
  '東部': 'region-east',
}

// 台灣22縣市
export const 縣市列表: County[] = [
  // 北部
  { id: 'taipei', name: '台北市', region: '北部', lat: 25.0330, lng: 121.5654 },
  { id: 'new-taipei', name: '新北市', region: '北部', lat: 25.0120, lng: 121.4657 },
  { id: 'keelung', name: '基隆市', region: '北部', lat: 25.1276, lng: 121.7392 },
  { id: 'taoyuan', name: '桃園市', region: '北部', lat: 24.9936, lng: 121.3010 },
  { id: 'hsinchu-city', name: '新竹市', region: '北部', lat: 24.8138, lng: 120.9675 },
  { id: 'hsinchu-county', name: '新竹縣', region: '北部', lat: 24.8388, lng: 121.0178 },
  { id: 'yilan', name: '宜蘭縣', region: '北部', lat: 24.7021, lng: 121.7378 },
  // 中部
  { id: 'miaoli', name: '苗栗縣', region: '中部', lat: 24.5602, lng: 120.8214 },
  { id: 'taichung', name: '台中市', region: '中部', lat: 24.1477, lng: 120.6736 },
  { id: 'changhua', name: '彰化縣', region: '中部', lat: 24.0518, lng: 120.5161 },
  { id: 'nantou', name: '南投縣', region: '中部', lat: 23.9610, lng: 120.9718 },
  { id: 'yunlin', name: '雲林縣', region: '中部', lat: 23.7092, lng: 120.4313 },
  // 南部
  { id: 'chiayi-city', name: '嘉義市', region: '南部', lat: 23.4801, lng: 120.4491 },
  { id: 'chiayi-county', name: '嘉義縣', region: '南部', lat: 23.4518, lng: 120.2555 },
  { id: 'tainan', name: '台南市', region: '南部', lat: 22.9999, lng: 120.2269 },
  { id: 'kaohsiung', name: '高雄市', region: '南部', lat: 22.6273, lng: 120.3014 },
  { id: 'pingtung', name: '屏東縣', region: '南部', lat: 22.5519, lng: 120.5487 },
  { id: 'penghu', name: '澎湖縣', region: '南部', lat: 23.5711, lng: 119.5793 },
  // 東部
  { id: 'hualien', name: '花蓮縣', region: '東部', lat: 23.9872, lng: 121.6016 },
  { id: 'taitung', name: '台東縣', region: '東部', lat: 22.7583, lng: 121.1444 },
  { id: 'kinmen', name: '金門縣', region: '東部', lat: 24.4493, lng: 118.3767 },
  { id: 'lienchiang', name: '連江縣', region: '東部', lat: 26.1505, lng: 119.9499 },
]

// 依區域分組
export const 依區域分組 = (region?: Region): County[] => {
  if (!region) return 縣市列表
  return 縣市列表.filter(c => c.region === region)
}

// 根據ID查找縣市
export const 查找縣市 = (id: string): County | undefined => {
  return 縣市列表.find(c => c.id === id)
}
