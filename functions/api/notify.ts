/**
 * Cloudflare Pages Function — Discord 通知代理
 * POST /api/notify
 * Body: { event: 'visit' | 'event_created', payload: object }
 *
 * 目的：把 Discord webhook URL 留在伺服器端，前端只看到 /api/notify。
 * 這樣 webhook URL 不會出現在 client bundle，被濫用時可以單純換掉 env 而不用發新版前端。
 */

interface Env {
  DISCORD_WEBHOOK_URL?: string
}

interface NotifyBody {
  event: 'visit' | 'event_created'
  payload?: Record<string, unknown>
}

const ALLOWED_ORIGIN = 'https://siokiu.criterium.tw'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// fallback：env 沒設時用這個（user 提供的 webhook，已 commit 在 git，不算秘密）
const FALLBACK_WEBHOOK = 'https://discord.com/api/webhooks/1498258453347700917/1Ven8e3xqbZyjjCr7qu7ZT5vl-4RDt6AtJTaJypNAEmBhNxr9EpnUXqhLx_DmlhY6wAs'

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: NotifyBody
  try {
    body = (await request.json()) as NotifyBody
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400, headers: CORS_HEADERS })
  }

  const webhook = env.DISCORD_WEBHOOK_URL || FALLBACK_WEBHOOK
  const payload = body.payload ?? {}

  let embed: Record<string, unknown>
  if (body.event === 'visit') {
    embed = {
      title: '有人造訪約騎公布欄',
      color: 5814783, // 紫
      fields: [
        { name: '頁面', value: String(payload.path ?? '/'), inline: true },
        { name: '使用者', value: String(payload.user ?? '未登入'), inline: true },
      ],
      timestamp: new Date().toISOString(),
    }
  } else if (body.event === 'event_created') {
    embed = {
      title: '新約騎發起',
      color: 3066993, // 綠
      fields: [
        { name: '標題', value: String(payload.title ?? '未命名'), inline: false },
        { name: '日期', value: String(payload.date ?? '-'), inline: true },
        { name: '集合', value: String(payload.spot ?? '-'), inline: true },
        { name: '縣市', value: String(payload.county ?? '-'), inline: true },
        { name: '發起人', value: String(payload.creator ?? '-'), inline: true },
      ],
      timestamp: new Date().toISOString(),
    }
  } else {
    return Response.json({ error: 'unknown event' }, { status: 400, headers: CORS_HEADERS })
  }

  // 不等 Discord 回覆，立刻 200 給前端（fire and forget）
  const ctx = (request as unknown as { ctx?: { waitUntil: (p: Promise<unknown>) => void } }).ctx
  const sendPromise = fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: null, embeds: [embed] }),
  }).catch(() => undefined)
  ctx?.waitUntil?.(sendPromise)

  return Response.json({ ok: true }, { headers: CORS_HEADERS })
}
