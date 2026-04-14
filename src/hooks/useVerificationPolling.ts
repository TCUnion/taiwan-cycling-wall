import { useEffect, useRef } from 'react'
import { 查詢認證狀態 } from '../utils/verificationService'

interface Options {
  token: string | null
  enabled: boolean
  onVerified: () => void
  onTimeout?: () => void
  intervalMs?: number
}

/** 每隔 intervalMs 毫秒輪詢認證狀態，verified 時觸發 callback，逾時觸發 onTimeout */
export function useVerificationPolling({ token, enabled, onVerified, onTimeout, intervalMs = 3000 }: Options) {
  const callbackRef = useRef(onVerified)
  const timeoutRef = useRef(onTimeout)

  useEffect(() => {
    callbackRef.current = onVerified
  }, [onVerified])

  useEffect(() => {
    timeoutRef.current = onTimeout
  }, [onTimeout])

  useEffect(() => {
    if (!enabled || !token) return

    const id = setInterval(async () => {
      const 狀態 = await 查詢認證狀態(token)
      if (狀態 === 'verified') {
        callbackRef.current()
      }
    }, intervalMs)

    // 10 分鐘後自動停止輪詢並通知逾時
    const timeout = setTimeout(() => {
      clearInterval(id)
      timeoutRef.current?.()
    }, 10 * 60 * 1000)

    return () => {
      clearInterval(id)
      clearTimeout(timeout)
    }
  }, [token, enabled, intervalMs])
}
