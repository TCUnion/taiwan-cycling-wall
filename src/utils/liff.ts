import liff from '@line/liff'

const LIFF_ID = import.meta.env.VITE_LIFF_ID as string | undefined

/** 初始化 LIFF SDK */
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

/** 取得 LINE 使用者 Profile */
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
    console.warn('[LIFF] 取得使用者失敗:', error)
    return null
  }
}

/** 關閉 LIFF 視窗 */
export function 關閉LIFF() {
  if (liff.isInClient()) {
    liff.closeWindow()
  }
}
