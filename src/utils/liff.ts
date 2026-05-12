import liff from '@line/liff'

const LIFF_ID = import.meta.env.VITE_LIFF_ID as string | undefined

const 已知異常_ANDROID_LINE版本 = ['26.6.0', '26.6.1']

export type LIFF環境檢查結果 = {
  是否異常版本: boolean
  os: string | null
  lineVersion: string | null
  訊息: string | null
}

export async function 初始化LIFF(): Promise<boolean> {
  if (!LIFF_ID) {
    console.warn('[LIFF] 未設定 VITE_LIFF_ID')
    return false
  }
  try {
    await liff.init({ liffId: LIFF_ID })
    return true
  } catch (error) {
    console.warn('[LIFF] 初始化失敗:', error)
    return false
  }
}

export function 檢查LIFF環境(): LIFF環境檢查結果 {
  let os: string | null = null
  let lineVersion: string | null = null
  try {
    os = liff.getOS() ?? null
    lineVersion = liff.getLineVersion() ?? null
  } catch {
    // SDK 未初始化或在非 LIFF 環境
  }

  const 是否異常版本 =
    os === 'android' &&
    !!lineVersion &&
    已知異常_ANDROID_LINE版本.includes(lineVersion)

  return {
    是否異常版本,
    os,
    lineVersion,
    訊息: 是否異常版本
      ? `偵測到 LINE for Android ${lineVersion} 已知異常版本，可能無法取得使用者資料。請更新 LINE App 至最新版本，或改用其他裝置開啟。`
      : null,
  }
}

export async function 取得LINE使用者(): Promise<{ userId: string; displayName: string; pictureUrl?: string } | null> {
  if (!liff.isLoggedIn()) {
    liff.login()
    return null
  }
  try {
    const profile = await liff.getProfile()
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
    }
  } catch (error) {
    const env = 檢查LIFF環境()
    if (env.是否異常版本) {
      console.warn('[LIFF] getProfile 失敗（已知 Android 版本異常）:', error)
    } else {
      console.warn('[LIFF] 取得使用者失敗:', error)
    }
    return null
  }
}

export function 關閉LIFF() {
  if (liff.isInClient()) {
    liff.closeWindow()
  }
}
