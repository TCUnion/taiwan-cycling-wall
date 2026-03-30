// Facebook SDK 載入與登入工具

import { 縣市列表 } from '../data/counties'

const FB_APP_ID = import.meta.env.VITE_FB_APP_ID as string

// Facebook SDK 型別
declare global {
  interface Window {
    fbAsyncInit: () => void
    FB: {
      init: (params: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void
      login: (callback: (response: FBLoginResponse) => void, params: { scope: string }) => void
      api: (path: string, paramsOrCallback: Record<string, string> | ((response: FBApiResponse) => void), callback?: (response: FBApiResponse) => void) => void
      getLoginStatus: (callback: (response: FBLoginResponse) => void) => void
    }
  }
}

interface FBLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown'
  authResponse?: {
    accessToken: string
    userID: string
  }
}

interface FBApiResponse {
  id?: string
  name?: string
  email?: string
  picture?: { data?: { url?: string } }
  hometown?: { name?: string }
  location?: { name?: string }
  error?: { message: string }
  [key: string]: unknown
}

export interface FBUserInfo {
  fbId: string
  name: string
  pictureUrl: string
  countyId: string  // 從 hometown/location 自動比對
  email?: string    // 使用者可能拒絕提供
}

// 粉絲頁資訊（從 /me/accounts API 回傳）
export interface FBPageInfo {
  pageId: string
  name: string
  pictureUrl: string
  accessToken: string
}

// 從 FB 地點名稱比對台灣縣市 ID
function 比對縣市(地點名稱?: string): string {
  if (!地點名稱) return ''
  // FB 回傳格式可能是「Taipei, Taiwan」或「台北市」等
  const 文字 = 地點名稱.toLowerCase()
  for (const 縣市 of 縣市列表) {
    // 比對中文名稱（如「台北市」、「新北市」）
    if (地點名稱.includes(縣市.name)) return 縣市.id
    // 比對英文名稱（如「Taipei」、「Kaohsiung」）
    if (文字.includes(縣市.id.replace('-', ' '))) return 縣市.id
  }
  // 常見英文對照
  const 英文對照: Record<string, string> = {
    'taipei': 'taipei', 'new taipei': 'new-taipei', 'keelung': 'keelung',
    'taoyuan': 'taoyuan', 'hsinchu': 'hsinchu-city', 'yilan': 'yilan',
    'miaoli': 'miaoli', 'taichung': 'taichung', 'changhua': 'changhua',
    'nantou': 'nantou', 'yunlin': 'yunlin', 'chiayi': 'chiayi-city',
    'tainan': 'tainan', 'kaohsiung': 'kaohsiung', 'pingtung': 'pingtung',
    'penghu': 'penghu', 'hualien': 'hualien', 'taitung': 'taitung',
    'kinmen': 'kinmen', 'lienchiang': 'lienchiang',
  }
  for (const [英文, id] of Object.entries(英文對照)) {
    if (文字.includes(英文)) return id
  }
  return ''
}

// 載入 Facebook SDK
let sdkLoaded = false
export function 載入FacebookSDK(): Promise<void> {
  if (sdkLoaded && window.FB) return Promise.resolve()

  return new Promise((resolve) => {
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v21.0',
      })
      sdkLoaded = true
      resolve()
    }

    // 插入 SDK script
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = 'https://connect.facebook.net/zh_TW/sdk.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  })
}

// 執行 Facebook 登入並取得使用者資訊
export function FB登入(): Promise<FBUserInfo> {
  return new Promise((resolve, reject) => {
    window.FB.login((loginRes) => {
      if (loginRes.status !== 'connected' || !loginRes.authResponse) {
        reject(new Error('使用者取消登入'))
        return
      }

      // 取得姓名、頭像、家鄉、所在地、email
      const fields = 'id,name,picture.width(200).height(200),hometown,location,email'
      window.FB.api(`/me?fields=${fields}`, (apiRes) => {
        if (apiRes.error) {
          reject(new Error(apiRes.error.message))
          return
        }

        // 優先用 location，沒有的話用 hometown
        const 地點 = apiRes.location?.name || apiRes.hometown?.name || ''
        const countyId = 比對縣市(地點)

        resolve({
          fbId: apiRes.id!,
          name: apiRes.name!,
          pictureUrl: apiRes.picture?.data?.url ?? '',
          countyId,
          email: apiRes.email as string | undefined,
        })
      })
    }, { scope: 'public_profile,email,user_hometown,user_location' })
  })
}

// 取得使用者管理的粉絲頁列表
export function 取得粉絲頁列表(): Promise<FBPageInfo[]> {
  return new Promise((resolve) => {
    if (!window.FB) { resolve([]); return }
    interface FBPagesResponse { data?: Array<{ id: string; name: string; picture?: { data?: { url?: string } }; access_token: string }>; error?: { message: string } }
    window.FB.api('/me/accounts', { fields: 'id,name,picture.width(200).height(200),access_token' }, ((response: FBPagesResponse) => {
      if (response.error || !response.data) {
        // pages_show_list 未授權或無管理粉絲頁時，靜默回傳空陣列
        resolve([])
        return
      }
      resolve(response.data.map(page => ({
        pageId: page.id,
        name: page.name,
        pictureUrl: page.picture?.data?.url ?? '',
        accessToken: page.access_token,
      })))
    }) as unknown as (response: FBApiResponse) => void)
  })
}
