// Cloudflare Pages Middleware
// 1) 攔截 squirrel 等工具自動探測的假 sitemap 路徑，回傳 404 避免誤報
// 2) Markdown for Agents（cloudflare.com/.../markdown-for-agents/）
//    當 client 帶 Accept: text/markdown 訪問 / 或 /index.html 時，
//    回傳 llms.txt 的純文字內容，並用 Content-Type: text/markdown

const FAKE_SITEMAP = new Set([
  '/sitemap_index.xml',
  '/sitemap-index.xml',
  '/sitemaps.xml',
  '/sitemap1.xml',
  '/post-sitemap.xml',
  '/page-sitemap.xml',
  '/news-sitemap.xml',
])

const MD_PATHS = new Set(['/', '/index.html', '/about', '/wall'])

function 接受Markdown(accept: string | null): boolean {
  if (!accept) return false
  // 精確比對 markdown，避免 */* 也命中
  return /\btext\/markdown\b/i.test(accept)
}

export async function onRequest(context: EventContext<unknown, string, unknown>) {
  const { request } = context
  const url = new URL(request.url)

  if (FAKE_SITEMAP.has(url.pathname)) {
    return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  }

  // Markdown 協商：對 SPA 頁面，回傳 llms.txt 當作 markdown 表述
  if (MD_PATHS.has(url.pathname) && 接受Markdown(request.headers.get('accept'))) {
    try {
      const llms = await fetch(new URL('/llms.txt', url.origin).toString())
      if (llms.ok) {
        const body = await llms.text()
        return new Response(body, {
          status: 200,
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'Vary': 'Accept',
            'X-Markdown-Source': '/llms.txt',
          },
        })
      }
    } catch {
      // 失敗就 fallback 走原本 HTML
    }
  }

  return context.next()
}
