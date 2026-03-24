import { useState } from 'react'

interface 地理位置 {
  lat: number
  lng: number
}

// 取得使用者地理位置 hook
export function useGeolocation() {
  const [位置, set位置] = useState<地理位置 | null>(null)
  const [錯誤, set錯誤] = useState<string | null>(null)
  const [載入中, set載入中] = useState(false)

  const 取得位置 = () => {
    if (!navigator.geolocation) {
      set錯誤('瀏覽器不支援定位功能')
      return
    }
    set載入中(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set位置({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        set載入中(false)
      },
      (err) => {
        set錯誤(err.message)
        set載入中(false)
      },
      { timeout: 10000 }
    )
  }

  return { 位置, 錯誤, 載入中, 取得位置 }
}
