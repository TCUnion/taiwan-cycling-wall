// Google Identity Services (GIS) 登入工具
// 優先 One Tap，失敗時 fallback 到 renderButton popup

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

/** Google JWT payload 中我們需要的欄位 */
interface GoogleJwtPayload {
  sub: string       // Google 使用者唯一 ID
  name: string
  picture: string
  email: string
  email_verified: boolean
}

// GIS SDK 型別
interface GoogleGIS {
  accounts: {
    id: {
      initialize: (config: Record<string, unknown>) => void
      prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void
    }
  }
}

/** 載入 Google GIS SDK（accounts.google.com/gsi/client） */
export function 載入GoogleSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('google-gsi-script')) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.id = 'google-gsi-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google SDK 載入失敗'))
    document.head.appendChild(script)
  })
}

/** 解碼 JWT（僅取 payload，不驗簽章——前端信任 Google 回傳） */
function 解碼JWT(token: string): GoogleJwtPayload {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
  // atob → 逐位元組轉 %XX → decodeURIComponent 還原 UTF-8
  const jsonStr = decodeURIComponent(
    atob(padded).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  )
  return JSON.parse(jsonStr)
}

/** 用隱藏的 Google 按鈕觸發 popup 登入（One Tap 被封鎖時的 fallback） */
function 觸發Popup登入(gis: GoogleGIS): void {
  // 建立螢幕外容器，放 Google 官方按鈕
  const 容器 = document.createElement('div')
  容器.style.position = 'fixed'
  容器.style.top = '-9999px'
  容器.style.left = '-9999px'
  document.body.appendChild(容器)

  gis.accounts.id.renderButton(容器, {
    type: 'standard',
    size: 'large',
    width: 300,
  })

  // 等 Google 渲染完按鈕後模擬點擊
  requestAnimationFrame(() => {
    const 按鈕 = 容器.querySelector('[role="button"]') as HTMLElement
      ?? 容器.querySelector('div[style]') as HTMLElement
    if (按鈕) {
      按鈕.click()
    }
    // 清除容器
    setTimeout(() => document.body.removeChild(容器), 500)
  })
}

/** 觸發 Google 登入，回傳使用者資訊 */
export function Google登入(): Promise<GoogleJwtPayload> {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('尚未設定 Google Client ID'))
      return
    }

    const gis = (window as unknown as { google: GoogleGIS }).google

    if (!gis?.accounts?.id) {
      reject(new Error('Google SDK 尚未載入'))
      return
    }

    gis.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => {
        try {
          const payload = 解碼JWT(response.credential)
          resolve(payload)
        } catch {
          reject(new Error('Google 登入資訊解析失敗'))
        }
      },
    })

    // 優先嘗試 One Tap，失敗時 fallback 到 popup 按鈕
    gis.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        觸發Popup登入(gis)
      }
    })
  })
}
