// Cloudflare Pages Function：為社群媒體爬蟲注入動態 OG meta
// 路由：/event/:id 和 /event/:id/share

interface Env {
  SUPABASE_ANON_KEY: string
}

const SUPABASE_URL = 'https://db.criterium.tw'
const SITE_URL = 'https://siokiu.criterium.tw'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

// 社群媒體爬蟲 User-Agent 特徵
const 爬蟲特徵 = [
  'facebookexternalhit',
  'Facebot',
  'LinkedInBot',
  'Twitterbot',
  'Slackbot',
  'Discordbot',
  'WhatsApp',
  'Line/',           // LINE 爬蟲
  'TelegramBot',
  'Googlebot',
  'bingbot',
  'Applebot',
]

function 是爬蟲(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  return 爬蟲特徵.some(bot => ua.includes(bot.toLowerCase()))
}

// 轉義 HTML 特殊字元
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// 從 Supabase REST API 取得活動資料
async function 取得活動(id: string, anonKey: string) {
  const url = `${SUPABASE_URL}/rest/v1/cycling_events?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  const res = await fetch(url, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    },
  })
  if (!res.ok) return null
  const data = await res.json() as Record<string, unknown>[]
  return data[0] ?? null
}

// 產生注入 OG meta 的 HTML
function 產生OG_HTML(活動: Record<string, unknown>, 原始路徑: string): string {
  const title = escapeHtml(String(活動.title || '約騎活動'))
  const date = String(活動.date || '')
  const time = String(活動.time || '')
  const meetingPoint = String(活動.meeting_point || '')
  const countyId = String(活動.county_id || '')
  const distance = Number(活動.distance) || 0
  const elevation = Number(活動.elevation) || 0
  // base64 data URL 無法被社群媒體爬蟲抓取，改用預設 OG 圖片
  const rawCoverImage = 活動.cover_image ? String(活動.cover_image) : ''
  const coverImage = rawCoverImage.startsWith('data:') ? '' : rawCoverImage

  // 組合描述文字
  const 描述片段: string[] = []
  if (date) 描述片段.push(date + (time ? ` ${time}` : ''))
  if (meetingPoint) 描述片段.push(meetingPoint)
  if (countyId) 描述片段.push(countyId)
  if (distance > 0) 描述片段.push(`${distance} km`)
  if (elevation > 0) 描述片段.push(`${elevation} m`)
  const description = escapeHtml(描述片段.join(' | ') || '一起來騎車吧！')

  const ogImage = coverImage || DEFAULT_OG_IMAGE
  const canonicalUrl = `${SITE_URL}${原始路徑}`

  return `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<meta charset="UTF-8" />
<title>${title} — 相揪約騎公布欄</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${title} — 相揪約騎公布欄" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${escapeHtml(ogImage)}" />
<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
<meta property="og:locale" content="zh_TW" />
<meta property="og:site_name" content="相揪約騎公布欄" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title} — 相揪約騎公布欄" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${escapeHtml(ogImage)}" />
</head>
<body>
<h1>${title}</h1>
<p>${description}</p>
<a href="${escapeHtml(canonicalUrl)}">查看活動詳情</a>
</body>
</html>`
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const userAgent = context.request.headers.get('user-agent') || ''

  // 非爬蟲：正常回傳 SPA
  if (!是爬蟲(userAgent)) {
    return context.next()
  }

  // 爬蟲：注入動態 OG meta
  const anonKey = context.env.SUPABASE_ANON_KEY
  if (!anonKey) {
    return context.next()
  }

  // 從 URL 中提取活動 ID（/event/{id} 或 /event/{id}/share）
  const url = new URL(context.request.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  // pathParts: ['event', '{id}'] 或 ['event', '{id}', 'share']
  const eventId = pathParts[1]
  if (!eventId) {
    return context.next()
  }

  const 活動 = await 取得活動(eventId, anonKey)
  if (!活動) {
    return context.next()
  }

  const html = 產生OG_HTML(活動, url.pathname)
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
