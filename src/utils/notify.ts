// 透過 Cloudflare Pages Function /api/notify 把事件推到 Discord
// 失敗時靜默吃掉，絕不阻擋使用者操作

const ENDPOINT = '/api/notify'

interface VisitPayload {
  path: string
  user?: string
}

interface EventCreatedPayload {
  title: string
  date: string
  spot?: string
  county?: string
  creator?: string
}

async function 送出(event: string, payload: Record<string, unknown>) {
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload }),
      keepalive: true,
    })
  } catch {
    // 通知失敗不影響使用者
  }
}

/** 整個 session 只發一次造訪通知 */
export function 通知網站造訪(payload: VisitPayload) {
  if (typeof window === 'undefined') return
  const KEY = '約騎-visit-notified'
  if (sessionStorage.getItem(KEY)) return
  sessionStorage.setItem(KEY, '1')
  void 送出('visit', payload as unknown as Record<string, unknown>)
}

export function 通知活動建立(payload: EventCreatedPayload) {
  void 送出('event_created', payload as unknown as Record<string, unknown>)
}
