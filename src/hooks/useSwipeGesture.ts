import { useRef, useEffect } from 'react'

interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

// 滑動手勢偵測 hook
export function useSwipeGesture<T extends HTMLElement>({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: SwipeOptions) {
  const ref = useRef<T>(null)
  const 起始X = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleTouchStart = (e: TouchEvent) => {
      起始X.current = e.touches[0].clientX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const 結束X = e.changedTouches[0].clientX
      const 差距 = 結束X - 起始X.current

      if (Math.abs(差距) > threshold) {
        if (差距 > 0) onSwipeRight?.()
        else onSwipeLeft?.()
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onSwipeLeft, onSwipeRight, threshold])

  return ref
}
