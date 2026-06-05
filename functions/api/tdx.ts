/**
 * Cloudflare Pages Function — TDX 運輸資料流通服務（觀光 API）代理
 *
 * GET /api/tdx?resource=cycling&city=Taichung    自行車道線型
 * GET /api/tdx?resource=scenicspot&city=Taichung 觀光景點
 *
 * 為什麼要 proxy：
 * 1. TDX 需 OAuth2 client_credentials（client_secret 不可放前端）
 * 2. TDX 免費層 rate limit 極嚴（頻繁 429）→ 用 Cloudflare 邊緣快取吸收流量
 *
 * 快取：自行車道更新慢 → 7 天；景點 → 1 天。token → 依 expires_in 快取，少打授權端點。
 */

interface Env {
  TDX_CLIENT_ID: string
  TDX_CLIENT_SECRET: string
}

const ALLOWED_ORIGIN = 'https://siokiu.criterium.tw'
const TDX_BASE = 'https://tdx.transportdata.tw/api/basic'
const TOKEN_URL = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token'

// 縣市英文 slug 白名單（同時用於 ScenicSpot/{slug} 與 Cycling/Shape/City/{slug}）
const CITY_SLUGS = new Set([
  'Taipei', 'NewTaipei', 'Keelung', 'Taoyuan', 'Hsinchu', 'HsinchuCounty',
  'YilanCounty', 'MiaoliCounty', 'Taichung', 'ChanghuaCounty', 'NantouCounty',
  'YunlinCounty', 'Chiayi', 'ChiayiCounty', 'Tainan', 'Kaohsiung',
  'PingtungCounty', 'PenghuCounty', 'HualienCounty', 'TaitungCounty',
  'KinmenCounty', 'LienchiangCounty',
])

// resource → [TDX path 樣板, 快取秒數]
const RESOURCES: Record<string, (city: string) => { path: string; ttl: number }> = {
  cycling: (city) => ({ path: `/v2/Cycling/Shape/City/${city}?$format=JSON`, ttl: 604800 }),
  scenicspot: (city) => ({ path: `/v2/Tourism/ScenicSpot/${city}?$format=JSON`, ttl: 86400 }),
}

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: corsHeaders })

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const { searchParams } = new URL(request.url)
  const resource = searchParams.get('resource') ?? ''
  const city = searchParams.get('city') ?? ''

  const build = RESOURCES[resource]
  if (!build) {
    return json({ error: '未支援的 resource', allowed: Object.keys(RESOURCES) }, 400)
  }
  if (!CITY_SLUGS.has(city)) {
    return json({ error: '未支援的 city slug' }, 400)
  }

  const { path, ttl } = build(city)
  const upstreamUrl = `${TDX_BASE}${path}`

  // 邊緣快取：以上游 URL 為 key
  const cache = caches.default
  const cacheKey = new Request(upstreamUrl, { method: 'GET' })
  const cached = await cache.match(cacheKey)
  if (cached) return withCors(cached)

  // 取 token（亦快取）
  let token: string
  try {
    token = await getToken(env, cache)
  } catch (err) {
    return json({ error: 'TDX 授權失敗', message: (err as Error).message }, 502)
  }

  let upstream: Response
  try {
    upstream = await fetch(upstreamUrl, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
    })
  } catch (err) {
    return json({ error: 'TDX 連線失敗', message: (err as Error).message }, 502)
  }

  if (!upstream.ok) {
    // 不快取錯誤回應
    return json({ error: `TDX 回應 ${upstream.status}` }, upstream.status === 429 ? 429 : 502)
  }

  const body = await upstream.text()
  const resp = new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${ttl}`,
    },
  })
  // 寫入邊緣快取（clone，因為 body 只能讀一次）
  await cache.put(cacheKey, resp.clone())
  return withCors(resp)
}

/** 取得 TDX access token，成功後依 expires_in 快取於邊緣 */
async function getToken(env: Env, cache: Cache): Promise<string> {
  const tokenCacheKey = new Request('https://tdx-token-cache.internal/token')
  const cachedToken = await cache.match(tokenCacheKey)
  if (cachedToken) return (await cachedToken.json<{ access_token: string }>()).access_token

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.TDX_CLIENT_ID,
      client_secret: env.TDX_CLIENT_SECRET,
    }),
  })
  if (!res.ok) throw new Error(`token endpoint ${res.status}`)

  const data = await res.json<{ access_token: string; expires_in?: number }>()
  // 提前 5 分鐘過期，避免邊界失效
  const ttl = Math.max(60, (data.expires_in ?? 86400) - 300)
  await cache.put(
    tokenCacheKey,
    new Response(JSON.stringify({ access_token: data.access_token }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${ttl}` },
    }),
  )
  return data.access_token
}

function withCors(resp: Response): Response {
  const r = new Response(resp.body, resp)
  r.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  return r
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
  })
}
